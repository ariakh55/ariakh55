exports.uniqFilterAccordingToProp = (prop) => {
  if (prop)
    return (ele, i, arr) =>
      arr.map((ele) => ele[prop]).indexOf(ele[prop]) === i;
  else return (ele, i, arr) => arr.indexOf(ele) === i;
};
