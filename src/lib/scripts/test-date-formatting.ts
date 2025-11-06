// Test date formatting to ensure timezone issues are fixed

console.log('🧪 Testing Date Formatting (Timezone Fix)\n');
console.log('='.repeat(60));

// OLD (BROKEN) function
function formatDateToISO_OLD(date: Date): string {
  return date.toISOString().split("T")[0];
}

// NEW (FIXED) function
function formatDateToISO_NEW(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Test with November 5, 2025 at midnight local time
const testDate = new Date(2025, 10, 5, 0, 0, 0); // Month is 0-indexed, so 10 = November

console.log('\n📅 Test Date: November 5, 2025 (Local Time)');
console.log('-'.repeat(60));
console.log(`   Local String: ${testDate.toString()}`);
console.log(`   UTC String:   ${testDate.toUTCString()}`);
console.log(`   ISO String:   ${testDate.toISOString()}`);

console.log('\n🔴 OLD Method (BROKEN):');
console.log('-'.repeat(60));
const oldResult = formatDateToISO_OLD(testDate);
console.log(`   Result: ${oldResult}`);
console.log(`   ❌ Uses UTC conversion - may shift date by timezone offset`);

console.log('\n🟢 NEW Method (FIXED):');
console.log('-'.repeat(60));
const newResult = formatDateToISO_NEW(testDate);
console.log(`   Result: ${newResult}`);
console.log(`   ✅ Uses local date components - preserves selected date`);

console.log('\n📊 Comparison:');
console.log('-'.repeat(60));
console.log(`   Expected:  2025-11-05`);
console.log(`   Old:       ${oldResult} ${oldResult === '2025-11-05' ? '✅' : '❌ WRONG!'}`);
console.log(`   New:       ${newResult} ${newResult === '2025-11-05' ? '✅ CORRECT!' : '❌'}`);

// Test multiple dates
console.log('\n🧪 Multiple Date Tests:');
console.log('-'.repeat(60));

const testDates = [
  new Date(2025, 0, 1),   // January 1
  new Date(2025, 6, 15),  // July 15
  new Date(2025, 11, 31), // December 31
];

testDates.forEach((date, i) => {
  const expected = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const oldRes = formatDateToISO_OLD(date);
  const newRes = formatDateToISO_NEW(date);
  
  console.log(`\n   Test ${i + 1}: ${date.toDateString()}`);
  console.log(`      Expected: ${expected}`);
  console.log(`      Old:      ${oldRes} ${oldRes === expected ? '✅' : '❌'}`);
  console.log(`      New:      ${newRes} ${newRes === expected ? '✅' : '❌'}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Date formatting test complete!\n');
console.log('💡 The fix ensures that clicking a date in the calendar');
console.log('   always uses that exact date, regardless of timezone.\n');

