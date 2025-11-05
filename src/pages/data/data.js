import "./data.scss";


import { LineGraph } from "../../components/LineGraph/LineGraph";
import { BarGraph } from "../../components/BarGraph/BarGraph";


export const Data = () => {
return (
<main className="data-page">
<header className="data-page__header">
<h1>Data</h1>
<p className="data-page__intro">
This page presents a simple, static view of climate indicators using
hard coded values derived from our JSON dataset. Below, the line chart 
shows atmospheric CO₂ over time, and the bar chart compares September  
sea ice extent between the Arctic and Antarctic.
</p>
</header>


<section className="data-page__content">
<div className="data-page__card">
<LineGraph />
</div>
<div className="data-page__card">
<BarGraph />
</div>
</section>
</main>
);
};