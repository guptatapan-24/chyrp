from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uuid
import os
from typing import List, Optional
from datetime import datetime
from slugify import slugify
import json
import httpx
from bs4 import BeautifulSoup
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import aiofiles
from supabase import create_client


# MongoDB Atlas Connection
MONGODB_URI = "mongodb+srv://guptatapan2006_db_user:jBEOvQtOjCWZnPu3@cluster0.sipb4st.mongodb.net/app_data?retryWrites=true&w=majority&appName=Cluster0"
client = AsyncIOMotorClient(MONGODB_URI)
db = client.get_database()  # Use DB from URI or specify name here

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "uploads")

supabase=create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "https://chyrp-pi.vercel.app",  # your frontend URL
    # Optionally add localhost URLs for development
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Update for production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    os.makedirs("uploads", exist_ok=True)


@app.on_event("shutdown")
async def shutdown():
    client.close()


# --- Utility: convert ObjectId to string deeply ---
def convert_objectid(doc):
    if isinstance(doc, list):
        return [convert_objectid(d) for d in doc]
    if isinstance(doc, dict):
        new_doc = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                if k == "_id":
                    # Rename _id key to id and convert to string
                    new_doc["id"] = str(v)
                else:
                    new_doc[k] = str(v)
            else:
                new_doc[k] = convert_objectid(v)
        return new_doc
    return doc

# --- USER REGISTRATION (DEV ONLY) ---
@app.post("/api/auth/demo-register")
async def demo_register(username: str = Form(...), password: str = Form(...)):
    existing = await db.users.find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    user = {
        "username": username,
        "password": password,  # Store hashed in production!
        "avatarUrl": None,
        "bio": None,
    }
    res = await db.users.insert_one(user)
    return {"msg": "user created", "id": str(res.inserted_id)}


@app.post("/webmention")
async def receive_webmention(source: str = Form(...), target: str = Form(...)):
    if not target.startswith("http://localhost:3000/posts/"):
        raise HTTPException(status_code=400, detail="Target URL not supported")

    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(source, timeout=10)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Source URL not reachable")
            content = response.text
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to fetch source URL")

    soup = BeautifulSoup(content, "html.parser")
    links = [a.get("href") for a in soup.find_all("a", href=True)]

    if target not in links:
        raise HTTPException(status_code=400, detail="Target URL not found on source page")

    author_name = None
    author_url = None
    mention_content = soup.title.string if soup.title else None

    post_slug = target.split("/posts/")[-1]
    post = await db.posts.find_one({"slug": post_slug})
    post_id = post["_id"] if post else None

    existing = await db.webmentions.find_one({"source_url": source, "target_url": target})
    if existing:
        return {"message": "Webmention already received"}

    webmention = {
        "source_url": source,
        "target_url": target,
        "author_name": author_name,
        "author_url": author_url,
        "content": mention_content,
        "published_at": None,
        "received_at": datetime.utcnow(),
        "post_id": post_id,
    }
    await db.webmentions.insert_one(webmention)
    return {"message": "Webmention received successfully"}


# --- AUTHENTICATION FOR NEXTAUTH ---
import logging

@app.post("/api/auth/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username")
    password = data.get("password")
    logging.info(f"Login attempt: username={username}, password={password}")
    user = await db.users.find_one({"username": username})
    if not user:
        logging.info("User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("password") != password:
        logging.info("Password mismatch")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logging.info("Login successful")
    return {"id": str(user["_id"]), "username": user["username"]}


# --- Increment Post Views ---
@app.post("/posts/{post_id}/view")
async def increment_post_view(post_id: str):
    try:
        oid = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await db.posts.find_one({"_id": oid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    new_views = (post.get("views") or 0) + 1
    await db.posts.update_one({"_id": oid}, {"$set": {"views": new_views}})
    return {"views": new_views}


# --- POSTS ---
@app.post("/posts")
async def create_post(
    title: str = Form(...),
    markdown: str = Form(""),
    user_id: str = Form(...),
    files: List[UploadFile] = File(None),
    type: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
):
    slug = slugify(title)
    tags_list = []
    if tags:
        try:
            tags_list = json.loads(tags)
        except Exception:
            tags_list = []

    post = {
        "title": title,
        "slug": slug,
        "markdown": markdown,
        "type": type,
        "user_id": ObjectId(user_id),
        "updated_at": datetime.utcnow(),
        "tags": tags_list,
        "link_url": link_url,
        "likes": 0,
        "views": 0,
    }
    res = await db.posts.insert_one(post)
    post_id = res.inserted_id

    file_urls = []
    if files:
        for file in files:
            url = await upload_file_to_supabase(file)
            file_urls.append(url)
            await db.post_files.insert_one({"post_id": post_id, "file_url": url})

    post["id"] = str(post_id)
    post["file_urls"] = file_urls
    return convert_objectid(post)


@app.get("/posts")
async def get_posts(page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)):
    skip = (page - 1) * page_size
    cursor = db.posts.find().skip(skip).limit(page_size).sort("updated_at", -1)
    posts = []
    async for doc in cursor:
        doc["author"] = None
        author = await db.users.find_one({"_id": doc["user_id"]})
        if author:
            doc["author"] = {
                "id": str(author["_id"]),
                "name": author.get("username"),
                "avatarUrl": author.get("avatarUrl"),
                "bio": author.get("bio"),
            }
        file_cursor = db.post_files.find({"post_id": doc["_id"]})
        file_urls = [f["file_url"] async for f in file_cursor]
        doc["file_urls"] = file_urls
        posts.append(convert_objectid(doc))
    total = await db.posts.count_documents({})
    next_page = page + 1 if skip + len(posts) < total else None
    return {"posts": posts, "nextPage": next_page}


@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    try:
        oid = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    post = await db.posts.find_one({"_id": oid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author = await db.users.find_one({"_id": post["user_id"]})
    post["author"] = None
    if author:
        post["author"] = {
            "id": str(author["_id"]),
            "name": author.get("username"),
            "avatarUrl": author.get("avatarUrl"),
            "bio": author.get("bio"),
        }
    file_cursor = db.post_files.find({"post_id": oid})
    post["file_urls"] = [f["file_url"] async for f in file_cursor]
    return convert_objectid(post)


@app.get("/posts/{post_id}/webmentions")
async def get_webmentions(post_id: str):
    try:
        oid = ObjectId(post_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

    mentions_cursor = db.webmentions.find({"post_id": oid})
    mentions = [convert_objectid(m) async for m in mentions_cursor]
    return mentions


# --- AUTHOR SUBSCRIPTION API ---
@app.get("/authors/{author_id}/subscription")
async def get_subscription_status(author_id: str, user_id: str = Query(...)):
    subscription = await db.authors_subscriptions.find_one(
        {
            "author_id": ObjectId(author_id),
            "subscriber_id": ObjectId(user_id),
        }
    )
    return {"subscribed": bool(subscription)}


@app.post("/authors/{author_id}/subscribe")
async def subscribe_author(author_id: str, user_id: str = Form(...)):
    author_oid = ObjectId(author_id)
    user_oid = ObjectId(user_id)
    existing = await db.authors_subscriptions.find_one(
        {"author_id": author_oid, "subscriber_id": user_oid}
    )
    if existing:
        return {"message": "Already subscribed"}
    await db.authors_subscriptions.insert_one(
        {"author_id": author_oid, "subscriber_id": user_oid}
    )
    return {"message": "Subscribed"}


@app.post("/authors/{author_id}/unsubscribe")
async def unsubscribe_author(author_id: str, user_id: str = Form(...)):
    author_oid = ObjectId(author_id)
    user_oid = ObjectId(user_id)
    await db.authors_subscriptions.delete_one(
        {"author_id": author_oid, "subscriber_id": user_oid}
    )
    return {"message": "Unsubscribed"}


# --- POST LIKES ---
@app.post("/posts/{post_id}/like")
async def like_post(post_id: str, user_id: str = Form(...)):
    post_oid = ObjectId(post_id)
    user_oid = ObjectId(user_id)
    post = await db.posts.find_one({"_id": post_oid})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing_like = await db.post_likes.find_one(
        {"post_id": post_oid, "user_id": user_oid}
    )
    if existing_like:
        return {
            "message": "User already liked this post",
            "likes": post.get("likes", 0),
        }

    await db.post_likes.insert_one({"post_id": post_oid, "user_id": user_oid})
    new_likes = post.get("likes", 0) + 1
    await db.posts.update_one({"_id": post_oid}, {"$set": {"likes": new_likes}})
    return {"message": "Post liked", "likes": new_likes}


@app.get("/posts/{post_id}/liked-by/{user_id}")
async def check_liked(post_id: str, user_id: str):
    post_oid = ObjectId(post_id)
    user_oid = ObjectId(user_id)
    existing_like = await db.post_likes.find_one(
        {"post_id": post_oid, "user_id": user_oid}
    )
    return {"liked": bool(existing_like)}


# --- COMMENTS ---
@app.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, text: str = Form(...), user_id: str = Form(...)):
    post_oid = ObjectId(post_id)
    user_oid = ObjectId(user_id)
    comment = {
        "post_id": post_oid,
        "text": text,
        "user_id": user_oid,
        "createdAt": datetime.utcnow(),
    }
    res = await db.comments.insert_one(comment)
    comment["id"] = str(res.inserted_id)
    user = await db.users.find_one({"_id": user_oid})
    comment["username"] = user["username"] if user else "Unknown"
    return comment


@app.get("/posts/{post_id}/comments")
async def get_comments(
    post_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    post_oid = ObjectId(post_id)
    skip = (page - 1) * page_size
    cursor = db.comments.find({"post_id": post_oid}).skip(skip).limit(page_size).sort("createdAt", -1)
    comments = []
    async for doc in cursor:
        user = await db.users.find_one({"_id": doc["user_id"]})
        doc["username"] = user["username"] if user else "Unknown"
        comments.append(convert_objectid(doc))
    total = await db.comments.count_documents({"post_id": post_oid})
    next_page = page + 1 if skip + len(comments) < total else None
    return {"comments": comments, "nextPage": next_page}


async def upload_file_to_supabase(file: UploadFile) -> str:
    ext = file.filename.split(".")[-1]
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    content = await file.read()
    res = supabase.storage.from_(SUPABASE_BUCKET).upload(unique_name, content)
    if res.get("error"):
        raise HTTPException(status_code=500, detail="Upload failed")
    public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(unique_name)
    return public_url.get("publicURL")

# Then your upload endpoint can call it
@app.post("/upload")
async def upload_endpoint(files: list[UploadFile]):
    urls = []
    for file in files:
        url = await upload_file_to_supabase(file)
        urls.append(url)
        # Save url in MongoDB as needed
    return {"urls": urls}
