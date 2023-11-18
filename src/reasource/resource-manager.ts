import * as fs from 'fs';
import yaml from 'js-yaml';
import { Resource, DropTableItem } from './resource';
import { Item } from '../item/item';

interface ResourceData {
  resources: Resource[];
}

export function loadResources(resourcePath: string, itemsMap: Map<number, Item>) {
  const resourceFile = fs.readFileSync(resourcePath, 'utf-8');
  const resourceData = yaml.load(resourceFile) as ResourceData;
  const resourceMap: Map<string, Resource[]> = new Map();

  for (const resource of resourceData.resources) {
    if (!resource.dropTable) {
      resource.dropTable = [];
    }

    const dropTable: DropTableItem[] = resource.dropTable
      .filter(dropTableItem => itemsMap.has(dropTableItem.itemId))
      .map(dropTableItem => {
        const item = itemsMap.get(dropTableItem.itemId);

        return {
        itemId: dropTableItem.itemId,
        item: item || undefined,
        chance: dropTableItem.chance,
      };
    });

    const newResource = new Resource(
      resource.resourceType,
      resource.name,
      resource.description,
      resource.quantity,
      resource.level,
      dropTable,
    );

    if (resourceMap.has(resource.resourceType)) {
      let resources = resourceMap.get(resource.resourceType);
      if (resources) {
        resources.push(newResource);
      }
    }
    else {
      resourceMap.set(resource.resourceType, [newResource]);
    }
  }

  return resourceMap;
}

