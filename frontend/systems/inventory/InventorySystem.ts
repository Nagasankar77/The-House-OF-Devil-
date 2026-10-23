import { InventoryItem } from '../../../shared/types';

export class InventorySystem {
  private items: Map<string, InventoryItem> = new Map();

  public addItem(item: InventoryItem): void {
    if (this.items.has(item.id)) {
      const existing = this.items.get(item.id)!;
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      this.items.set(item.id, { ...item, quantity: item.quantity || 1 });
    }
  }

  public removeItem(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  public hasItem(itemId: string): boolean {
    return this.items.has(itemId);
  }

  public getItem(itemId: string): InventoryItem | undefined {
    return this.items.get(itemId);
  }

  public getItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  public clear(): void {
    this.items.clear();
  }
}
