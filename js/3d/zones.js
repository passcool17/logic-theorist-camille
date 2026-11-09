/**
 * Zones du campus 3D — une par chapitre, déblocage séquentiel.
 */

export const ZONES = [
  { id: 'z1', chapterId: 'ch1', num: 1, title: 'Une machine qui raisonne', x: -8, z: 6, color: '#6B8F71' },
  { id: 'z2', chapterId: 'ch2', num: 2, title: 'L’atelier de 1955', x: 8, z: 6, color: '#8FAE7B' },
  { id: 'z3', chapterId: 'ch3', num: 3, title: 'Les règles du jeu', x: -8, z: -6, color: '#A3B88C' },
  { id: 'z4', chapterId: 'ch4', num: 4, title: 'Prouve comme LT', x: 8, z: -6, color: '#C4784A' },
  { id: 'z5', chapterId: 'ch5', num: 5, title: 'Pourquoi c’est important', x: 0, z: -12, color: '#5A7A62' },
];

/** Zone débloquée si elle est la 1re ou si le chapitre précédent est complété. */
export function isZoneUnlocked(save, zoneId) {
  const zone = ZONES.find((z) => z.id === zoneId);
  if (!zone) return false;
  if (zone.num === 1) return true;
  if (save.zones && save.zones[zoneId]) return true;
  const prev = ZONES.find((z) => z.num === zone.num - 1);
  return !!(prev && save.completed && save.completed[prev.chapterId]);
}

/** Après un chapitre terminé, débloque la zone suivante et marque la courante. */
export function afterChapterComplete(save, chapterId) {
  const zone = ZONES.find((z) => z.chapterId === chapterId);
  const zones = { ...(save.zones || { z1: true }) };
  if (zone) zones[zone.id] = true;
  const next = zone && ZONES.find((z) => z.num === zone.num + 1);
  if (next) zones[next.id] = true;
  return { ...save, zones };
}

/** Liste des zones accessibles pour l’UI / le monde. */
export function unlockedZones(save) {
  return ZONES.filter((z) => isZoneUnlocked(save, z.id));
}

/** Téléport QA : position près d’une zone. */
export function zoneSpawn(zoneId) {
  const z = ZONES.find((x) => x.id === zoneId) || ZONES[0];
  return { x: z.x, z: z.z + 2.2 };
}
