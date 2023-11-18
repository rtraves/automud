export class LifeSkill  {
    name: string;
    level: number;
    experience: number;

    constructor(name: string, level: number, experience: number) {
        this.name = name;
        this.level = level;
        this.experience = experience;
    }

    private static readonly BASE_LIFE_SKILL_EXP: number = 100;

    static expForLevel(level: number): number {
      return LifeSkill.BASE_LIFE_SKILL_EXP * (level * (level + 1) * (2*level + 1) / 6);
    }
  
    gainExperience(amount: number) {
      this.experience += amount;
      this.updateLevel();
    }
  
    updateLevel(): void {
      let newLevel = 1;
      while (LifeSkill.expForLevel(newLevel) <= this.experience && newLevel < 100) {
        newLevel++;
      }
      if (newLevel !== this.level) {
        this.level = newLevel;
      }
    }
  
    experienceToNextLevel(): number {
      const nextLevelExp = LifeSkill.expForLevel(this.level + 1);
      return nextLevelExp - this.experience;
    }
  }