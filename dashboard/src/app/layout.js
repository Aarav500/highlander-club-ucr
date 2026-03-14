import "./globals.css";

export const metadata = {
  title: "AI Lab Dashboard",
  description: "Live status dashboard for the fullstack-template AI Lab",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
