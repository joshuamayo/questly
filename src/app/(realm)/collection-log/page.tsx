import type { Metadata } from "next";
import { PageBanner } from "@/components/art/PageBanner";
import { CollectionLog } from "@/components/meta/CollectionLog";
import { loadCollection } from "@/server/queries";

export const metadata: Metadata = { title: "Collection Log" };

export default async function CollectionLogPage() {
  const items = await loadCollection();
  return (
    <>
      <PageBanner slot="collection-log" title="Collection Log" tagline="A museum of everything you have accomplished." />
      <CollectionLog items={items} />
    </>
  );
}
