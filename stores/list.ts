import create from "zustand";
import { DateTime } from "luxon";
import { Data, DataByDay, Filter, Item } from "@/lib/types";

interface State {
  loading: boolean;
  setLoading: (state: boolean) => void;
  data: Data;
  setData: (data: Data) => void;
  filter: Filter;
  setFilter: (filter: Filter) => void;
  groupByDay: () => DataByDay;
  hasData: () => boolean;
  fetchData: () => Promise<void>;
}

const store = create<State>((set, get) => ({
  loading: true,
  setLoading: (state) => set(() => ({ loading: state })),
  data: { lastUpdate: "", data: [] },
  setData: (data) => set(() => ({ data })),
  filter: { hide: 2 },
  setFilter: (filter) =>
    set((state) => ({ filter: { ...state.filter, ...filter } })),
  groupByDay: (): DataByDay => {
    const { data, filter } = get();
    return data.data.reduce((acc, row) => {
      const date = DateTime.fromSQL(row.date, {
        zone: "Europe/Istanbul",
        locale: "tr",
      })
        .startOf("day")
        .toISODate();

      if (!acc[date]) {
        acc[date] = [];
      }

      if (row.magnitude >= filter.hide) {
        acc[date].push(new Item(row));
      }

      return acc;
    }, {} as DataByDay);
  },
  hasData: (): boolean => {
    const { groupByDay } = get();
    return Object.values(groupByDay()).flatMap((o) => o).length > 0;
  },
  fetchData: async () => {
    const { setLoading, setData } = get();
    try {
      setLoading(true);
      const res = await fetch("/api");
      const data = await res.json();
      setData(data);
    } catch (e) {
      console.error(e);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
    }
  },
}));

export default store;