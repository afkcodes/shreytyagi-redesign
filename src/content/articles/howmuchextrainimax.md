---
title: "Calculating Effective % Extra IMAX Image for Variable Aspect Ratio Movies"
date: 2025-04-16
category: "Cinemas"
---

IMAX advertises 26% extra image for their expanded aspect ratio movies. But that holds true only if the entire movie is expanded. If the movie only has 10-20% scenes expanded, is it not wrong to say 26% more? Because for 80%-90% of the runtime you'll still be watching the exact same image as non-IMAX venues! So to calculate the effective % extra image, we need to consider the duration of IMAX scenes. This is a formula I made to calculate this. So if,

- D<sub>f</sub> = Duration of Full Movie
- D<sub>i</sub> = Duration of IMAX Scenes
- D<sub>o</sub> = Duration of Opening Credits
- D<sub>e</sub> = Duration of End Credits
- A<sub>n</sub> = Aspect Ratio of non-IMAX Scenes
- A<sub>i</sub> = Aspect Ratio of IMAX Scenes

Then the Effective % Extra IMAX Image =

$$
\frac{D_i}{D_f - D_o - D_e} \times \left( \frac{A_n}{A_i} - 1 \right) \times 100
$$

For example, the movie Sinners which had 25 mins of IMAX footage and a runtime of 137 mins. If you're watching at an IMAX 1.43:1 venue, then values will be:

- D<sub>f</sub> = 137
- D<sub>i</sub> = 25
- D<sub>o</sub> = 1
- D<sub>e</sub> = 5
- A<sub>n</sub> = 2.76
- A<sub>i</sub> = 1.43

So the Effective % Extra IMAX Image =

$$
\frac{25}{137 - 1 - 5} \times \left( \frac{2.76}{1.43} - 1 \right) \times 100
$$

\= 17.7%

Whereas, if you're watching at an IMAX 1.90:1 venue, then the value of A<sub>i</sub> will be 1.90 and rest all values will be same.

So the Effective % Extra IMAX Image =

$$
\frac{25}{137 - 1 - 5} \times \left( \frac{2.76}{1.90} - 1 \right) \times 100
$$

\= 8.6%

Another example, the movie Blade Runner 2049 was expanded to 1.90:1 ratio at IMAX venues for the entire duration while non-IMAX venues got 2.39:1 for the entire duration. The values will be:

- D<sub>f</sub> = 146 (removing opening and end credits)
- D<sub>i</sub> = 152
- D<sub>o</sub> = 1
- D<sub>e</sub> = 5
- A<sub>n</sub> = 2.39
- A<sub>i</sub> = 1.90

So the Effective % Extra IMAX Image =

$$
\frac{146}{152 - 1 - 5} \times \left( \frac{2.39}{1.90} - 1 \right) \times 100
$$

\= 26%

So as you can see, only if the entire movie is expanded, it would be correct to say terms like 26% extra image at IMAX. Otherwise, the percentage would be far lower. The percentage also helps to decide how worth is it to watch a movie at IMAX than non-IMAX cinemas if extra image is the only thing being considered.
