
export const nums = [1,2,3,4,5,6,7,8,9,10];

function filter_only() {
  const a = nums.filter(a => a > 10);
  return (nums).filter(c => c < 10);
}

function filter_idx() {
  const a = nums.filter((a, idx) => a > idx);
  return nums.filter((c, idx) => c < idx);
}

function filter_idx_arr() {
  const a = nums.filter((a, idx, arr) => idx*2 < arr.length);
  return nums.filter((c, idx, arr) => c < arr[0]);
}

function filter_map() {
  const a = nums.filter(a => a > 10).map(b => b*b);
  return (nums).filter(c => c < 10).map(d => d*2);
}  

function filter_map_idx() {
  const a = nums.filter(a => a > 10).map((b, idx) => b*idx);
  return (nums).filter(c => c < 10).map((d, idx) => d*2 - idx);
}  

function filter_idx_map() {
  const a = nums.filter((a, idx) => a > idx).map(b => b*b);
  return nums.filter((c, idx) => c < idx).map(d => d*2);
}  

function filter_map_reduce() {
  const acc = '', _a = 3;
  return nums.filter(e => e & 1).map(f => f*3).reduce((sum, a) => ++sum + a + acc.length + _a, 0);
}

function map_only() {
  return nums.map(x => x*2);
}

function map_idx() {
  return nums.map((x, idx) => x - idx);
}

function map_idx_arr() {
  return nums.map((x, idx, arr) => x - idx + arr[0]);
}

function map_to_literal() {
  return nums.map(() => true);
}

function not_array() {
  const nums = {} as any;
  // since 'nums' is not an array, these should not be replaced
  const a = nums.map(g => g+2);
  return nums.filter(e => e & 1).map(f => f*3);
}
