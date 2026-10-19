
import { tagColor } from "../../utils/tasks";


export default function TagPill({ tag }) {
  if (!tag) return null;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-[#4A2F20]"
      style={{ background: tagColor(tag) }}
    >
      {tag}
    </span>
  );
}
