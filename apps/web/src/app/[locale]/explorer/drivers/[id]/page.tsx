import {
  SeasonExplorer,
  type ExplorerPageProps,
} from "@/components/explorer/season-explorer";
export const dynamic = "force-dynamic";
export default async function Page(props: ExplorerPageProps) {
  return <SeasonExplorer {...props} kind="driver" />;
}
