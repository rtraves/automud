export interface Quest {
    id: number;
    name: string;
    description: string;
    objectives: QuestObjective[];
    rewards: QuestReward[];
  }
  
 export interface QuestObjective {
    description: string;
    type: string;  // e.g., "collect", "kill", etc.
    targetId: number;  // ID of the item/NPC/etc. related to the objective
    targetQuantity: number;  // Quantity of items/NPCs/etc. needed to complete the objective
  }
  
export interface QuestReward {
    type: string;  // e.g., "item", "experience", "gold", etc.
    value: number;
    itemId?: number;  // If the reward is an item, this is the ID of the item
  }
  