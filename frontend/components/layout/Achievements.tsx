import type { PublicUser } from "@/types";

type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  target: number;
  value: (user: PublicUser) => number;
};

const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first-match", title: "First_Match", description: "Complete your first match", target: 1, value: user => user.gamesPlayed },
  { id: "first-win", title: "First_Win", description: "Win your first match", target: 1, value: user => user.gamesWon },
  { id: "challenger", title: "Challenger", description: "Complete 10 matches", target: 10, value: user => user.gamesPlayed },
  { id: "tactician", title: "Tactician", description: "Win 5 matches", target: 5, value: user => user.gamesWon },
  { id: "rising-star", title: "Rising_Star", description: "Reach level 5", target: 5, value: user => user.level },
];

export default function Achievements({ user }: { user: PublicUser }) {
  const baseProgress = ACHIEVEMENTS.map(achievement => {
    const current = Math.max(0, achievement.value(user));
    return {
      ...achievement,
      current,
      unlocked: current >= achievement.target,
      percent: Math.min(100, (current / achievement.target) * 100),
    };
  });
  const completed = baseProgress.filter(achievement => achievement.unlocked).length;
  const progress = [
    ...baseProgress,
    {
      id: "reversi-master",
      title: "Reversi_Master",
      description: "Unlock every other achievement",
      target: baseProgress.length,
      current: completed,
      unlocked: completed === baseProgress.length,
      percent: (completed / baseProgress.length) * 100,
    },
  ];
  const unlocked = progress.filter(achievement => achievement.unlocked).length;

  return (
    <section className="achievements" aria-labelledby="achievements-title">
      <div className="achievements-header">
        <h2 id="achievements-title">Achievements</h2>
        <span>{unlocked}/{progress.length}_Unlocked</span>
      </div>
      <div className="achievements-grid">
        {progress.map(achievement => (
          <article key={achievement.id} className={["achievement", achievement.unlocked ? "unlocked" : "locked", achievement.id === "reversi-master" ? "master" : ""].join(" ")}>
            <div className="achievement-status" aria-hidden="true">
              {achievement.unlocked ? "OK" : "--"}
            </div>
            <div className="achievement-copy">
              <h3>{achievement.title}</h3>
              <p>{achievement.description}</p>
              <div className="achievement-progress" aria-label={`${Math.min(achievement.current, achievement.target)} of ${achievement.target}`}>
                <i style={{ width: `${achievement.percent}%` }} />
              </div>
              <span>{Math.min(achievement.current, achievement.target)}/{achievement.target}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
