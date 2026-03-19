async function main() {
  try {
    const res = await fetch('https://vedicscriptures.github.io/slok/1/1');
    const data = await res.json();
    console.log("vedicscriptures API output:");
    console.log(data);
  } catch (e) {
    console.error("vedicscriptures API failed:", e.message);
  }
}
main();
