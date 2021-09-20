import React from "react";
import ReactDOM from "react-dom";
import ValveScout from "./container/ValveScout.jsx";

const valveScoutElem = document.getElementById("valve-scout");
const locale = valveScoutElem.getAttribute("data-locale");

ReactDOM.render(<ValveScout locale={locale} />, valveScoutElem);
