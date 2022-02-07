// (async () => {
//   const el = document.querySelector(`body + script[data-args]`);
//   const { evtToPage, evtFromPage } = JSON.parse(el.dataset.args);
//   //   el.remove();

//   addEventListener(evtToPage, () => {
//     dispatchEvent(
//       new CustomEvent(evtFromPage, {
//         detail: window.BOOMR,
//       })
//     );
//   });
// })();
