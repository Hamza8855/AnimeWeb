import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import SiteChrome from "../components/SiteChrome";

export const metadata = {
  title: "Anime Infinite Death",
  description: "Anime content, battles, characters and stories.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>
          <ToastProvider>{children}</ToastProvider>
        </SiteChrome>
      </body>
    </html>
  );
}
