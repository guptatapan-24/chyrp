import "./globals.css";
import AuthProvider from "./providers/AuthProvider";
import TopBar from "../../components/TopBar"; // adjust path if needed
import QueryProvider from "../../components/QueryProvider"; // adjust path as needed
import Script from "next/script";

export const metadata = {
  title: "Modern Chyrp",
  description: "A Modern Chyrp Lite Clone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Load MathJax script in the document head before user interaction */}
        <Script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="beforeInteractive"
          id="MathJax-script"
        />
      </head>
      <body className="transition-all bg-gray-50 dark:bg-[#22223B] text-gray-900 dark:text-gray-200">
        <QueryProvider>
          <AuthProvider>
            <TopBar />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
