import type { ClassId, Item, ItemType } from "./types";

let _itemId = 0;
function mk(type: ItemType, name: string, description: string, opts: Partial<Item> = {}): Item {
  _itemId += 1;
  return {
    id: `${type}_${Date.now()}_${_itemId}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    type,
    description,
    ...opts,
  };
}

export function rollStarterInventory(classId: ClassId): { inventory: Item[]; equipped: { weapon?: Item; armor?: Item; accessory?: Item } } {
  switch (classId) {
    case "warrior": {
      const sword = mk("weapon", "Épée longue", "Acier forgé sur mesure. Équilibrée, fiable.", { slot: "weapon", flavor: "+ tranchant en duel" });
      const plate = mk("armor", "Plastron de plates", "Lourd mais rassurant. A déjà sauvé une vie.", { slot: "armor", flavor: "+ encaisse les coups" });
      return {
        inventory: [
          sword,
          plate,
          mk("potion", "Potion de soin", "Récupère un peu de PV.", { consumable: true, quantity: 2 }),
          mk("tool", "Pierre à aiguiser", "Pour garder le fil net."),
        ],
        equipped: { weapon: sword, armor: plate },
      };
    }
    case "mage": {
      const staff = mk("weapon", "Bâton runique", "Bois noueux gravé de runes anciennes.", { slot: "weapon", flavor: "+ focalise les sorts" });
      const robes = mk("armor", "Robes arcaniques", "Tissu enchanté, léger, broderies d'argent.", { slot: "armor" });
      return {
        inventory: [
          staff,
          robes,
          mk("scroll", "Parchemin de Boule de feu", "Lance une boule de feu (1 usage).", { consumable: true, quantity: 1 }),
          mk("tool", "Grimoire", "Tes notes, tes formules, tes secrets."),
          mk("potion", "Potion de mana", "Restaure ton énergie magique.", { consumable: true, quantity: 1 }),
        ],
        equipped: { weapon: staff, armor: robes },
      };
    }
    case "rogue": {
      const daggers = mk("weapon", "Dagues jumelles", "Lames courtes, équilibrées pour le lancer.", { slot: "weapon" });
      const leather = mk("armor", "Cuir noir", "Souple, silencieux. Capuche profonde.", { slot: "armor" });
      return {
        inventory: [
          daggers,
          leather,
          mk("tool", "Crochets de serrurier", "Aucune porte n'est vraiment fermée."),
          mk("potion", "Potion d'invisibilité", "Disparais 1 minute.", { consumable: true, quantity: 1 }),
          mk("misc", "Bourse de pièces", "20 po, gagnées « honnêtement »."),
        ],
        equipped: { weapon: daggers, armor: leather },
      };
    }
    case "paladin": {
      const hammer = mk("weapon", "Marteau de guerre béni", "Frappe avec la lumière du serment.", { slot: "weapon" });
      const silver = mk("armor", "Plates argentées", "Gravées de symboles sacrés.", { slot: "armor" });
      const symbol = mk("accessory", "Symbole sacré", "Pendentif lumineux. Repousse l'ombre.", { slot: "accessory" });
      return {
        inventory: [
          hammer,
          silver,
          symbol,
          mk("potion", "Eau bénite", "Brûle les morts-vivants.", { consumable: true, quantity: 2 }),
        ],
        equipped: { weapon: hammer, armor: silver, accessory: symbol },
      };
    }
    case "ranger": {
      const bow = mk("weapon", "Arc long", "Tendu fort, vise loin.", { slot: "weapon" });
      const cloak = mk("armor", "Cuir des bois", "Couleur mousse, capuche profonde.", { slot: "armor" });
      return {
        inventory: [
          bow,
          cloak,
          mk("misc", "Carquois (20 flèches)", "Empennage gris-bleu."),
          mk("tool", "Couteau de chasse", "Dépècer, tailler, défendre."),
          mk("potion", "Potion de soin", "Récupère un peu de PV.", { consumable: true, quantity: 1 }),
        ],
        equipped: { weapon: bow, armor: cloak },
      };
    }
    case "cleric": {
      const mace = mk("weapon", "Masse ornée", "Tête lourde, manche gravé.", { slot: "weapon" });
      const mail = mk("armor", "Cotte de mailles", "Anneaux serrés sous la robe.", { slot: "armor" });
      const symbol = mk("accessory", "Symbole sacré", "Canalise les bénédictions.", { slot: "accessory" });
      return {
        inventory: [
          mace,
          mail,
          symbol,
          mk("potion", "Potion de soin", "Récupère un peu de PV.", { consumable: true, quantity: 3 }),
          mk("scroll", "Parchemin de Bénédiction", "Bénit un allié.", { consumable: true, quantity: 1 }),
        ],
        equipped: { weapon: mace, armor: mail, accessory: symbol },
      };
    }
    case "barbarian": {
      const axe = mk("weapon", "Hache à deux mains", "Taillée dans un cœur de chêne.", { slot: "weapon" });
      const fur = mk("armor", "Fourrures et cuir", "Trophées de chasses anciennes.", { slot: "armor" });
      return {
        inventory: [
          axe,
          fur,
          mk("misc", "Totem de la tribu", "Te rattache à tes ancêtres."),
          mk("potion", "Hydromel fort", "Régénère et fait monter la rage.", { consumable: true, quantity: 2 }),
        ],
        equipped: { weapon: axe, armor: fur },
      };
    }
    case "bard": {
      const rapier = mk("weapon", "Rapière", "Vive, élégante, mortelle dans les bons gants.", { slot: "weapon" });
      const fancy = mk("armor", "Vêtements raffinés", "Coupés pour impressionner et bouger.", { slot: "armor" });
      const lute = mk("accessory", "Luth de voyage", "Cordes neuves, accord juste.", { slot: "accessory" });
      return {
        inventory: [
          rapier,
          fancy,
          lute,
          mk("tool", "Encrier et plume", "Pour noter une chanson, ou un contrat."),
          mk("potion", "Vin de cour", "Délie les langues des PNJ.", { consumable: true, quantity: 1 }),
        ],
        equipped: { weapon: rapier, armor: fancy, accessory: lute },
      };
    }
  }
}

export const ITEM_TYPE_LABELS: Record<ItemType, { label: string; color: string; glyph: string }> = {
  weapon:    { label: "Arme",       color: "var(--ember)",    glyph: "⚔" },
  armor:     { label: "Armure",     color: "var(--gold-400)", glyph: "🛡" },
  accessory: { label: "Accessoire", color: "var(--moss)",     glyph: "✦" },
  potion:    { label: "Potion",     color: "var(--arcane)",   glyph: "🧪" },
  scroll:    { label: "Parchemin",  color: "#c9a24a",         glyph: "📜" },
  tool:      { label: "Outil",      color: "#8b8270",         glyph: "⚙" },
  misc:      { label: "Divers",     color: "#6b6155",         glyph: "◆" },
};
