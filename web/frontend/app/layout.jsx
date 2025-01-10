import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/component/Nav";
import { NotificationProvider } from "@/components/component/NotificationProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Safe Pickup System",
  description: "Student pickup management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          <div className="grid min-h-screen w-full grid-cols-[280px_1fr]">
            <Nav />
            <main>{children}</main>
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
