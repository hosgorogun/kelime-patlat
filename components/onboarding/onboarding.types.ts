export type GuideTabKey = "basics" | "modes" | "leagues" | "powers" | "economy" | "tactics";

export type GuideBlock = {
  title: string;
  details: string[];
  tag?: string;
  tagColor?: string;
};

export type GuideSection = {
  key: GuideTabKey;
  tabLabel: string;
  badge: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  blocks: GuideBlock[];
  customVisual?: "route" | "modes" | "leagues" | "rewards" | "multipliers";
};
