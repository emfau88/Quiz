// Shared by the standalone HTML and the GitHub Pages browser test editions.
// It sells no product, records no purchase and never enters a Play entitlement state.
export const profileScope = 'quizsalon-lokaltest';
export function themeAccess() {
  return {allowed:true, label:'Lokaler Thementest', topicLabel:'Freie lokale Themenrunde', state:'local',
    description:'In dieser lokalen Testausgabe kannst du alle Kategorien und beide Schwierigkeitsstufen frei ausprobieren.',
    message:'Diese Testausgabe speichert keinen Kauf und erteilt keine Google-Play-Berechtigung.',
    price:'', canPurchase:false, canRestore:false};
}
