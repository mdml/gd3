#!/usr/bin/env node

// Load required modules
var jsdom = require('jsdom'),
fs = require('fs');

// Validate args
var argv = require('optimist').argv;
if (!( argv.outdir && argv.json )){
    usage  = "Usage: node drawOncoprint.js --json=</path/to/json>"
    usage += " --outdir=</path/to/output>"
    console.log(usage);
    process.exit(1);
}

// Load the data and parse into shorter variable handles
var data = JSON.parse(fs.readFileSync(argv.json).toString())
, M = data.M
, sample2ty = data.sample2ty
, coverage_str = data.coverage_str;

// Scripts required to make oncoprint
var scripts = [ "js/lib/jquery.js",
                "js/lib/d3.v3.min.js",
                "js/oncoprinter.js",
                "js/style/default-style.js"
              ]
, htmlStub = '<!DOCTYPE html><oncoprint></oncoprint>';

var src = scripts.map(function(S){ return fs.readFileSync(S).toString(); })

// Globals to store the loaded JS libraries
var d3, $;

// Parameters for drawing the oncoprint
var width = 900

// Function to notify user if write fails
function write_err(err){ if (err){ console.log('Could not output result.'); } }

jsdom.env({features:{QuerySelector:true}, html:htmlStub, src:src, done:function(errors, window) {
    // Make libraries global loaded in window
    d3 = window.d3;
    $  = window.jQuery;
    
    // Create the oncoprint in the headless browser
    var el = d3.select("oncoprint");
    window.oncoprinter(el, M, sample2ty, coverage_str, width);

    // Make sure all SVGs are properly defined
    d3.selectAll("svg").attr("xmlns", "http://www.w3.org/2000/svg") 

    // Write the oncoprint to file
    var oncoprint = $("svg#oncoprint")[0].outerHTML;
    fs.writeFile(argv.outdir + "/oncoprint.svg", oncoprint, write_err);

    // Write the mutation type legend to file
    var mutationLegend = $("svg#mutation-legend")[0].outerHTML;
    fs.writeFile(argv.outdir + "/mutLegend.svg", mutationLegend, write_err);

    // Write the sample type legend to file (if necessary)
    var sampleTyLegend = $("svg#sample-type-legend")[0].outerHTML;
    if (sampleTyLegend)
        fs.writeFile(argv.outdir + "/sampleTyLegend.svg", sampleTyLegend, write_err);

}});