import { CardUI } from "@/components/card-ui";

const classes = [
  { name: "Mathematics - Grade 8", time: "09:30 AM", status: "Live" },
  { name: "Physics - Grade 10", time: "11:00 AM", status: "Upcoming" },
  { name: "English - Grade 7", time: "02:15 PM", status: "Upcoming" },
];

export default function ClassesPage() {
  return (
    <section className="space-y-3">
      {classes.map((item) => (
        <CardUI key={item.name} title={item.name}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">{item.time}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.status === "Live" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.status}
            </span>
          </div>
        </CardUI>
      ))}
    </section>
  );
}
