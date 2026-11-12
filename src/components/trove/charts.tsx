import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatDate } from "@/lib/dates";
import type { DayPoint } from "@/lib/stats.server";

const axis = { tickLine: false, axisLine: false, tickMargin: 8 } as const;

export function PagesPerDayChart({ data }: { data: DayPoint[] }) {
  const config = { pages: { label: "Pages", color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" {...axis} minTickGap={24} tickFormatter={(d: string) => formatDate(d, { month: "short", day: "numeric" })} />
        <YAxis {...axis} width={32} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent labelFormatter={(d) => formatDate(String(d), { weekday: "short", month: "short", day: "numeric" })} />}
        />
        <Bar dataKey="pages" fill="var(--color-pages)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function MinutesPerDayChart({ data }: { data: DayPoint[] }) {
  const config = { minutes: { label: "Minutes", color: "var(--chart-3)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} barCategoryGap={2}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" {...axis} minTickGap={24} tickFormatter={(d: string) => formatDate(d, { month: "short", day: "numeric" })} />
        <YAxis {...axis} width={32} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent labelFormatter={(d) => formatDate(String(d), { weekday: "short", month: "short", day: "numeric" })} />}
        />
        <Bar dataKey="minutes" fill="var(--color-minutes)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function MonthlyFinishedChart({ data }: { data: { month: string; books: number }[] }) {
  const config = { books: { label: "Books finished", color: "var(--chart-2)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} width={24} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="books" fill="var(--color-books)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function WeekdayChart({ data }: { data: { day: string; pages: number }[] }) {
  const config = { pages: { label: "Pages", color: "var(--chart-7)" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" {...axis} />
        <YAxis {...axis} width={32} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="pages" fill="var(--color-pages)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function RatingChart({ data }: { data: { rating: number; count: number }[] }) {
  const config = { count: { label: "Books", color: "var(--chart-4)" } } satisfies ChartConfig;
  const rows = data.map((d) => ({ ...d, label: "★".repeat(d.rating) })).reverse();
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={rows} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey="label" {...axis} width={64} />
        <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

/** Up to 8 genres (the 8th is "Other"), each pinned to a categorical slot in fixed order. */
export function GenreChart({ data }: { data: { name: string; books: number }[] }) {
  const config: ChartConfig = { books: { label: "Books" } };
  for (const d of data) config[d.name] = { label: d.name };
  const color = (name: string, i: number) => (name === "Other" ? "var(--muted-foreground)" : `var(--chart-${i + 1})`);
  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-80 w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie data={data} dataKey="books" nameKey="name" innerRadius="55%" strokeWidth={2} stroke="var(--card)">
          {data.map((d, i) => (
            <Cell key={d.name} fill={color(d.name, i)} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="flex-wrap gap-x-3 gap-y-1" />
      </PieChart>
    </ChartContainer>
  );
}
