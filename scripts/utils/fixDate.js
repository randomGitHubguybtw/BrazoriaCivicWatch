export function fixDate(dateString) {
  let [year, month, day] = dateString.split('-');


  if (year.length === 2) {
    year = `20${year}`; 
  }

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('en-US', {
    month: 'long', 
    day: 'numeric', 
    year: 'numeric'
  });
}
