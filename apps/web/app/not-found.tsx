import { shell } from "@umnyaut/catalog";
import type { Metadata } from "next";
import { NotFoundPage } from "@/views/not-found";

export const metadata: Metadata = { title: shell.notFound.metaTitle, robots: { index: false, follow: true } };

export default NotFoundPage;
