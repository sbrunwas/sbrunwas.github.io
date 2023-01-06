---
layout: post
title: ECCOJAMS
date: 2022-01-06
excerpt: "The greatest hits of my PhD in a Python package."
tags: [Python, neural data, spikes, package, lab]
comments: false
---

One of the unique experiences (and occassional headaches) of being the first grad student in my PhD lab was that if there was an analysis I needed to do, I often had to write the basic scripts to do it from scratch.  Occasionally I found repo's from other labs with useful code.  But inevitably there were times I had to get my hands dirty and write the code myself.  (Okay yes I like getting my hands dirty).

Well now that I recently defended, I thought it would be a good time to compile my "top hits" of scripts I wrote throughout my PhD for the analysis of chronic single unit and behavior data.  I've put it together into a Python package I'm calling Eccojams.  Click the dolphin below to check it out!

<a href="https://github.com/hengenlab/eccojams"><img width="80%" src="https://github.com/hengenlab/eccojams/blob/master/eccojams_text_logo.png?raw=true" alt="Eccojams"></a>

Eccojams is built on top of two of the lab's other packages: Neuraltoolkit and Musclebeachtools.  Neuraltoolkit is useful for processing raw ephys data as it comes off the electrode.  Musclebeachtools contains our lab's Neuron object which we use for all single units derived from spike sorting in other environments.  Each Neuron object then has a set of properties and functions which can be used to quality check and score the isolation of single units post-spike sorting.  Eccojams fits into the lab's ecosystem by providing a bunch of functions to perform common analyses on lists/arrays of Neuron objects.  There are also a few other functions for various operations on behavioral data in the lab.  I've included a tutorial in the package which should also make things easy to get up and running.  I hope the members of the lab and maybe others outside the lab will find these functions useful!

If you're curious about the name and want to dive into some strange waters, you may be interested in this quintessential vaporwave album which is named after a video game which is based on the life and work of a famous NMDA receptor enthusiast.  As my med school physiology professor once said, "We all have a little see inside of us."

<iframe width="420" height="236" src="https://www.youtube.com/embed/8Pu6I_7lrk8" title="The album that started it all..." frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>