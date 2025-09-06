"use client";
import React from "react";
import { WithContext as ReactTags, SEPARATORS } from "react-tag-input";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function TagInput({ tags, setTags }) {
  const handleDelete = (i) => setTags(tags.filter((_, idx) => idx !== i));
  const handleAddition = (tag) => setTags([...tags, tag]);
  const handleDrag = (tag, currPos, newPos) => {
    const newTags = [...tags];
    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    setTags(newTags);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <ReactTags
        tags={tags}
        handleDelete={handleDelete}
        handleAddition={handleAddition}
        handleDrag={handleDrag}
        delimiters={[SEPARATORS.COMMA, SEPARATORS.ENTER]}
        inputFieldPosition="bottom"
        autocomplete
        placeholder="Press enter or comma to add tag"
      />
    </DndProvider>
  );
}
