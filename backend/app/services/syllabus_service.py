from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.services.ai_generator import AITaskGenerator

# Preloaded comprehensive syllabus repository matching user's exact university syllabus documents
COURSES_SYLLABUS_DB: Dict[str, Dict[str, Any]] = {
    "artificial-intelligence": {
        "id": "artificial-intelligence",
        "title": "Artificial Intelligence & Expert Systems",
        "code": "CS-AI",
        "description": "Comprehensive course covering intelligent agents, search algorithms, knowledge representation, expert systems, and decision support.",
        "textbooks": [
            "S. Russell and P. Norvig, 'Artificial Intelligence: A Modern Approach', Pearson Education, 3rd Edition, 2015",
            "Elaine Rich and Kelvin Knight, 'Artificial Intelligence', Tata McGraw Hill, 3rd Edition, 2017",
            "DAN.W. Patterson, 'Introduction to A.I. and Expert Systems', PHI, 2007"
        ],
        "units": [
            {
                "unit_number": "UNIT-I",
                "title": "INTRODUCTION TO AI",
                "periods": 9,
                "course_outcome": "CO1: Understand the concepts of AI and Intelligent Agents.",
                "topics": [
                    {
                        "name": "Introduction to Artificial Intelligence",
                        "subtopics": [
                            "Various definitions of AI (Thinking Humanly, Thinking Rationally, Acting Humanly, Acting Rationally)",
                            "AI Applications across healthcare, robotics, gaming, and finance",
                            "AI Techniques and search spaces",
                            "Turing Test: Criteria, Loebner Prize, and Chinese Room argument"
                        ],
                        "sample_questions": [
                            "What is the Turing Test? Explain its setup, significance, and limitations.",
                            "Compare forward chaining and backward chaining with an example knowledge base."
                        ]
                    },
                    {
                        "name": "Intelligent Agents & Agent Architecture",
                        "subtopics": [
                            "Introduction to Intelligent Agents and PEAS Framework (Performance, Environment, Actuators, Sensors)",
                            "Rational Agent concept and rationality vs omniscience",
                            "Simple Reflex Agents, Model-Based Reflex Agents",
                            "Goal-Based Agents and Utility-Based Agents",
                            "Environment characteristics: Fully vs Partially Observable, Deterministic vs Stochastic, Episodic vs Sequential, Static vs Dynamic, Discrete vs Continuous, Single vs Multi-agent"
                        ],
                        "sample_questions": [
                            "Explain the structure of a Model-Based Reflex Agent with a neat architecture diagram.",
                            "Define PEAS description for an Automated Taxi Driver and Medical Diagnosis System."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-II",
                "title": "PROBLEM SOLVING TECHNIQUES",
                "periods": 9,
                "course_outcome": "CO2: Acquire various Problem-solving techniques and search algorithms.",
                "topics": [
                    {
                        "name": "Uninformed (Blind) Search Techniques",
                        "subtopics": [
                            "Problem Characteristics (Decomposable, Can steps be undone, Predictable universe)",
                            "Production Systems and Control Strategies",
                            "Breadth First Search (BFS): Algorithm, completeness, space and time complexity O(b^d)",
                            "Depth First Search (DFS): Algorithm, memory footprint, depth bound",
                            "Iterative Deepening Search (IDDFS): Combining BFS completeness with DFS space complexity",
                            "Uniform Cost Search (UCS): Dijkstra-based step cost optimization"
                        ],
                        "sample_questions": [
                            "Compare BFS, DFS, and Iterative Deepening in terms of time, space complexity, completeness, and optimality.",
                            "Trace Uniform Cost Search on a given state space graph to find the minimum cost path."
                        ]
                    },
                    {
                        "name": "Heuristic Search & Adversarial Game Search",
                        "subtopics": [
                            "Hill Climbing Search, Foothills, Plateaus, Ridges, and Random-restart Hill Climbing",
                            "Simulated Annealing and Temperature cooling schedule",
                            "Genetic Algorithm Search: Selection, Crossover, Mutation, Fitness function",
                            "Best First Search (Greedy Search)",
                            "A* Algorithm: Admissible heuristics h(n) <= h*(n), Consistency, f(n) = g(n) + h(n)",
                            "AO* Algorithm for AND-OR graphs",
                            "Game Trees: Min-Max Algorithm for two-player zero-sum games",
                            "Alpha-Beta Pruning: Mathematical cutoff conditions and branch reduction",
                            "Constraint Satisfaction Problems (CSP): Backtracking search, Forward Checking, Arc Consistency (AC-3)",
                            "Means-End Analysis (MEA) and difference operator tables"
                        ],
                        "sample_questions": [
                            "Explain the A* algorithm and prove that A* is optimal when using an admissible heuristic.",
                            "Apply Alpha-Beta pruning on a given game tree of depth 3 and identify all pruned branches."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-III",
                "title": "KNOWLEDGE REPRESENTATION AND UNCERTAIN KNOWLEDGE",
                "periods": 9,
                "course_outcome": "CO3: Explore the concepts of knowledge representation and uncertain knowledge.",
                "topics": [
                    {
                        "name": "Knowledge Representation Formalisms",
                        "subtopics": [
                            "First Order Predicate Calculus (FOPC): Quantifiers, Predicates, Clauses",
                            "Resolution Principle: Clause form conversion, Unification algorithm, Refutation tree",
                            "Semantic Networks and 'is-a', 'has-a' inheritance hierarchies",
                            "Conceptual Dependencies (CD Theory) by Roger Schank: Primitive ACTs",
                            "Frames System: Slots, Facets, Default values, and Demons",
                            "Production Rules (IF-THEN rules) and Conflict Resolution strategies",
                            "Conceptual Graphs and Ontologies (OWL / RDF)"
                        ],
                        "sample_questions": [
                            "Convert given English statements into First Order Logic and prove conclusion using Resolution Refutation.",
                            "Explain the structure of Semantic Nets and Frames with illustrative examples."
                        ]
                    },
                    {
                        "name": "Reasoning with Uncertain Knowledge",
                        "subtopics": [
                            "Types of Uncertainty: Incomplete information, Noise, Non-monotonicity",
                            "Probability constructs and Axioms of probability",
                            "Bayes' Rule and Bayesian Inference P(A|B) = [P(B|A) * P(A)] / P(B)",
                            "Dempster-Shafer Theory: Belief function, Plausibility, and Evidence combination",
                            "Fuzzy Sets & Logic: Membership functions, Fuzzy operations, Defuzzification"
                        ],
                        "sample_questions": [
                            "Explain Bayes' Rule and calculate posterior disease probability given test sensitivity and specificity.",
                            "Differentiate Classical Boolean Sets from Fuzzy Sets with membership graphs."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-IV",
                "title": "INTRODUCTION TO EXPERT SYSTEM",
                "periods": 9,
                "course_outcome": "CO4: Understand the concepts of Expert System.",
                "topics": [
                    {
                        "name": "Expert System Architecture & Life Cycle",
                        "subtopics": [
                            "Meaning and definition of an Expert System (ES)",
                            "Problem domain vs Knowledge domain",
                            "Core advantages and limitations of Expert Systems",
                            "General stages in developing an Expert System (Feasibility, Knowledge acquisition, Prototyping, Validation, Deployment)",
                            "Key components: Knowledge Base, Inference Engine, Working Memory, Explanation Facility",
                            "History and benchmark systems: MYCIN, DENDRAL, PROSPECTOR"
                        ],
                        "sample_questions": [
                            "Draw the architectural block diagram of an Expert System and explain the role of the Inference Engine and Explanation Facility.",
                            "What is knowledge acquisition bottleneck in expert system development and how is it addressed?"
                        ]
                    },
                    {
                        "name": "Rule-Based Paradigms & Neural Comparison",
                        "subtopics": [
                            "Rule-Based Expert Systems: Forward vs Backward chaining inference",
                            "Procedural vs Nonprocedural programming paradigms in AI",
                            "Characteristics and comparison of Expert Systems vs Artificial Neural Systems"
                        ],
                        "sample_questions": [
                            "Compare Rule-Based Expert Systems with Artificial Neural Networks across explanation capability, learning, and fault tolerance."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-V",
                "title": "KNOWLEDGE REPRESENTATION AND INFERENCE",
                "periods": 9,
                "course_outcome": "CO5: Explore knowledge representation and inference methods.",
                "topics": [
                    {
                        "name": "Logic Representation & Inference Methods",
                        "subtopics": [
                            "Difference between Formal Logic and Informal Logic",
                            "Representation of Knowledge in state spaces, trees, lattices, and graphs",
                            "AND-OR trees and goal reduction",
                            "Limitations of rule inference: Monotonicity, Tractability, Brittleness",
                            "Meta-knowledge (Knowledge about knowledge)"
                        ],
                        "sample_questions": [
                            "Explain AND-OR graph search and contrast it with standard state space search."
                        ]
                    },
                    {
                        "name": "Decision Processes & Intelligent Decision Support",
                        "subtopics": [
                            "Markov Decision Process (MDP): States, Actions, Transition Probabilities, Rewards, Discount factor",
                            "Decision Making using Machine Learning",
                            "Decision Support Systems (DSS) architecture",
                            "Role of AI in Intelligent Decision Support Systems (IDSS)"
                        ],
                        "sample_questions": [
                            "Formulate a Markov Decision Process (MDP) and explain the Bellman Optimality Equation.",
                            "Explain how AI transforms traditional Decision Support Systems into Intelligent Decision Support Systems."
                        ]
                    }
                ]
            }
        ]
    },
    "design-and-analysis-of-algorithms": {
        "id": "design-and-analysis-of-algorithms",
        "title": "Design and Analysis of Algorithms (DAA)",
        "code": "CS-DAA",
        "description": "Fundamental algorithm design paradigms: divide-and-conquer, greedy, dynamic programming, backtracking, and branch-and-bound.",
        "textbooks": [
            "Levitin Anany, 'Introduction to the Design and Analysis of Algorithms', Pearson Education India, 1st Edition, 2019",
            "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein, 'Introduction to Algorithms', MIT Press"
        ],
        "units": [
            {
                "unit_number": "UNIT-I",
                "title": "INTRODUCTION TO ALGORITHM AND DIVIDE AND CONQUER",
                "periods": 10,
                "course_outcome": "CO1: Analyze performance and apply divide-and-conquer techniques.",
                "topics": [
                    {
                        "name": "Algorithm Analysis & Asymptotic Notations",
                        "subtopics": [
                            "Algorithm definition and pseudocode conventions",
                            "Performance Analysis: Time complexity vs Space complexity",
                            "Best, Average, and Worst-case analysis",
                            "Asymptotic Notations: Big-O (upper bound), Omega (lower bound), Theta (tight bound), Little-o, Little-omega",
                            "Recurrence Relations: Substitution method, Recursion Tree, Master Theorem"
                        ],
                        "sample_questions": [
                            "State the Master Theorem and solve T(n) = 2T(n/2) + n.",
                            "Define Big-Oh, Omega, and Theta notations mathematically with graphical plots."
                        ]
                    },
                    {
                        "name": "Divide and Conquer Method",
                        "subtopics": [
                            "Divide and conquer paradigm and general recurrence",
                            "Binary Search: Algorithm, recurrence T(n) = T(n/2) + O(1), O(log n) analysis",
                            "Merge Sort: Algorithm, divide and merge procedures, O(n log n) stable sorting",
                            "Quick Sort: Partition algorithms (Lomuto vs Hoare), worst case O(n^2), average case O(n log n)"
                        ],
                        "sample_questions": [
                            "Write the Merge Sort algorithm and trace it step-by-step for the array [38, 27, 43, 3, 9, 82, 10].",
                            "Explain Quick Sort partitioning and discuss how pivot selection impacts worst-case time complexity."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-II",
                "title": "GREEDY METHOD AND DYNAMIC PROGRAMMING",
                "periods": 10,
                "course_outcome": "CO2: Apply greedy and dynamic programming paradigms.",
                "topics": [
                    {
                        "name": "Greedy Method & Network Optimization",
                        "subtopics": [
                            "Greedy method characteristics and optimal substructure / greedy-choice property",
                            "Fractional Knapsack Problem: Sorting by value/weight ratio, O(n log n)",
                            "Minimum Cost Spanning Trees: Prim's Algorithm vs Kruskal's Algorithm with Disjoint Set Union (DSU)",
                            "Single Source Shortest Path: Dijkstra's Algorithm with Priority Queue"
                        ],
                        "sample_questions": [
                            "Explain Dijkstra's algorithm for single-source shortest path and compute shortest paths on a given directed graph.",
                            "Differentiate Prim's and Kruskal's minimum spanning tree algorithms."
                        ]
                    },
                    {
                        "name": "Dynamic Programming (DP)",
                        "subtopics": [
                            "DP principles: Overlapping subproblems, Memoization vs Tabulation",
                            "Multistage Graphs: Forward and backward approaches",
                            "0/1 Knapsack Problem using DP: Recurrence relation V[i, w] = max(V[i-1, w], V[i-1, w-wi] + vi)",
                            "All Pairs Shortest Path: Floyd-Warshall Algorithm O(V^3)",
                            "Traveling Salesperson Problem (TSP) using Held-Karp DP O(n^2 * 2^n)"
                        ],
                        "sample_questions": [
                            "Solve the 0/1 Knapsack problem using dynamic programming for capacity W=5 and items: {(w:2, v:12), (w:1, v:10), (w:3, v:20), (w:2, v:15)}.",
                            "Explain Floyd-Warshall algorithm with its recurrence relation and construct distance matrices."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-III",
                "title": "BACKTRACKING AND BRANCH AND BOUND",
                "periods": 10,
                "course_outcome": "CO3: Solve combinatorial problems with backtracking and branch-and-bound.",
                "topics": [
                    {
                        "name": "Backtracking Paradigm",
                        "subtopics": [
                            "Backtracking principles: State space tree, bounding functions, depth-first pruning",
                            "N-Queens Problem: 4-Queens and 8-Queens placement validation",
                            "Sum of Subsets Problem: Generating subsets that sum up to target M",
                            "Graph Coloring Problem: m-Colorability and chromatic number",
                            "Hamiltonian Cycle: Finding simple cycle visiting every vertex exactly once",
                            "0/1 Knapsack Problem with Backtracking"
                        ],
                        "sample_questions": [
                            "Explain the 4-Queens backtracking algorithm and draw the state space tree.",
                            "Solve the Sum of Subsets problem for set S={3, 5, 6, 7} and target sum M=15."
                        ]
                    },
                    {
                        "name": "Branch and Bound Paradigm",
                        "subtopics": [
                            "Branch and Bound principles: State space tree, Upper and Lower bounds",
                            "LC (Least Cost) Branch and Bound search",
                            "FIFO Branch and Bound search",
                            "0/1 Knapsack Problem using Branch and Bound (Upper bound estimation)",
                            "Traveling Salesperson Problem (TSP) using Reduced Cost Matrix Branch and Bound"
                        ],
                        "sample_questions": [
                            "Compare Backtracking and Branch and Bound paradigms in terms of state space exploration and suitability.",
                            "Solve TSP using Branch and Bound with row and column reduction matrices."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-IV & V",
                "title": "LABORATORY EXERCISES & IMPLEMENTATIONS",
                "periods": 30,
                "course_outcome": "CO4 & CO5: Programmatic verification of algorithms.",
                "topics": [
                    {
                        "name": "Core Algorithm Implementations",
                        "subtopics": [
                            "Implementation of Binary search and finding Min-Max using Divide and Conquer",
                            "Implementation of Fractional Knapsack using Greedy technique",
                            "Implementation of Minimum Spanning Tree using Prim's and Kruskal's",
                            "Implementation of Dijkstra's Single-Source Shortest Paths",
                            "Implementation of All-Pairs Shortest Path (Floyd-Warshall)",
                            "Implementation of 8-Queens with Backtracking",
                            "Implementation of Traveling Salesman Problem with Dynamic Programming and Branch-and-Bound"
                        ],
                        "sample_questions": [
                            "Write clean C++/Python code to implement Dijkstra's algorithm using priority queue.",
                            "Write a recursive Backtracking program for the 8-Queens puzzle."
                        ]
                    }
                ]
            }
        ]
    },
    "probability-and-statistics": {
        "id": "probability-and-statistics",
        "title": "Probability, Statistics & Random Processes",
        "code": "MA-PSRP",
        "description": "Probability theory, random variables, analysis of variances, hypothesis testing for large and small samples.",
        "textbooks": [
            "T. Veerarajan, 'Probability, Statistics and Random Processes', Tata McGraw-Hill, 3rd Edition, 2008",
            "A. Singaravelu, 'Probability and Statistics', Meenakshi Agency, 2019",
            "S.C. Gupta, V.K. Kapur, 'Fundamental of Mathematical Statistics', Sultan Chand & Sons, 12th Edition, 2022"
        ],
        "units": [
            {
                "unit_number": "UNIT-I",
                "title": "THEORY OF PROBABILITY",
                "periods": 12,
                "course_outcome": "CO1: Understand the concept of probability and conditional theorems.",
                "topics": [
                    {
                        "name": "Foundational Probability Axioms & Theorems",
                        "subtopics": [
                            "Random Experiments, Outcomes, Sample Space S, and Events",
                            "Mutually Exclusive, Exhaustive, and Independent events",
                            "Axiomatic Definition of Probability (Kolmogorov's Axioms)",
                            "Addition Theorem of Probability P(A U B) = P(A) + P(B) - P(A ∩ B)",
                            "Conditional Probability P(A|B) = P(A ∩ B) / P(B)",
                            "Multiplication Theorem and Law of Total Probability",
                            "Bayes' Theorem: Prior, Likelihood, and Posterior probability calculations"
                        ],
                        "sample_questions": [
                            "State and prove Bayes' Theorem. Explain its application in statistical inference.",
                            "Three machines A, B, C produce 50%, 30%, 20% of items with defect rates 2%, 3%, 4%. If an item drawn is defective, find the probability it was produced by Machine A."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-II",
                "title": "RANDOM VARIABLES",
                "periods": 12,
                "course_outcome": "CO2: Solve problems on discrete and continuous random variables.",
                "topics": [
                    {
                        "name": "Discrete Random Variables & Distributions",
                        "subtopics": [
                            "Definition of Random Variable (Discrete vs Continuous)",
                            "Probability Mass Function (PMF) and Cumulative Distribution Function (CDF)",
                            "Binomial Distribution: PMF P(X=k) = nCk * p^k * q^(n-k), Mean = np, Variance = npq",
                            "Poisson Distribution: P(X=k) = (e^-lambda * lambda^k) / k!, Poisson as limiting form of Binomial"
                        ],
                        "sample_questions": [
                            "Derive the Mean and Variance of a Binomial Distribution.",
                            "If X follows a Poisson distribution such that P(X=1) = 2 * P(X=2), find P(X=0) and P(X=3)."
                        ]
                    },
                    {
                        "name": "Continuous Random Variables & Distributions",
                        "subtopics": [
                            "Probability Density Function (PDF) f(x) and its properties integral(f(x)dx) = 1",
                            "Exponential Distribution: PDF f(x) = lambda * e^(-lambda * x), Memoryless property",
                            "Normal Distribution: Bell-shaped curve, Standard Normal Z = (X - mu)/sigma, Empirical rule"
                        ],
                        "sample_questions": [
                            "State and prove the Memoryless Property of the Exponential distribution.",
                            "The marks of 1000 students are normally distributed with mean 70 and standard deviation 5. Find the number of students scoring above 80."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-III",
                "title": "STATISTICS & ANALYSIS OF VARIANCES",
                "periods": 12,
                "course_outcome": "CO3: Understand correlation, regression, and ANOVA.",
                "topics": [
                    {
                        "name": "Correlation & Regression",
                        "subtopics": [
                            "Karl Pearson's Coefficient of Correlation r",
                            "Spearman's Rank Correlation Coefficient with tied and untied ranks",
                            "Linear Regression: Lines of regression of Y on X and X on Y, Regression coefficients byx and bxy",
                            "Angle between two regression lines"
                        ],
                        "sample_questions": [
                            "Prove that the coefficient of correlation is the geometric mean of the regression coefficients.",
                            "Compute the rank correlation coefficient for given marks in Mathematics and Statistics."
                        ]
                    },
                    {
                        "name": "Analysis of Variance (ANOVA)",
                        "subtopics": [
                            "Concept and assumptions of ANOVA",
                            "One-way ANOVA: Total Sum of Squares (TSS), Between-treatment (SSTR), Within-treatment (SSE)",
                            "Two-way ANOVA: Row treatment, Column treatment, and Error variation",
                            "F-test statistic calculation and ANOVA summary table construction"
                        ],
                        "sample_questions": [
                            "Perform One-way ANOVA for three different teaching methods to test if mean scores differ significantly at alpha = 0.05."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-IV",
                "title": "LARGE SAMPLES (PARAMETRIC TESTS)",
                "periods": 12,
                "course_outcome": "CO4: Apply hypothesis testing for large samples (N >= 30).",
                "topics": [
                    {
                        "name": "Z-Tests for Large Samples",
                        "subtopics": [
                            "Null Hypothesis H0 vs Alternative Hypothesis H1, Type I and Type II errors",
                            "Level of significance (alpha = 1%, 5%), Critical values for one-tailed and two-tailed tests",
                            "Test of Significance for Single Proportion: Z = (p - P) / sqrt(P*Q/n)",
                            "Test of Significance for Difference of Proportions",
                            "Test of Significance for Single Mean: Z = (X_bar - mu) / (sigma / sqrt(n))",
                            "Test of Significance for Difference of Means and Difference of Standard Deviations"
                        ],
                        "sample_questions": [
                            "A sample of 400 male students has mean height 171 cm with SD 10 cm. Can we conclude the population mean height is 170 cm at 5% significance level?",
                            "Explain the steps for testing the difference between two sample proportions."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-V",
                "title": "SMALL SAMPLES (EXACT TESTS)",
                "periods": 12,
                "course_outcome": "CO5: Analyze problems in small samples (N < 30).",
                "topics": [
                    {
                        "name": "t-Test, F-Test, and Chi-Square Tests",
                        "subtopics": [
                            "Student's t-Distribution and degrees of freedom",
                            "t-Test for Single Mean and Difference of Two Means (Independent samples)",
                            "Paired t-Test for dependent samples (Before and After observations)",
                            "Snedecor's F-Test for ratio of two population variances S1^2 / S2^2",
                            "Chi-Square Test (χ²) for Goodness of Fit",
                            "Chi-Square Test for Independence of Attributes in Contingency tables (r x c)"
                        ],
                        "sample_questions": [
                            "Ten individuals underwent a physical training program. Test using paired t-test whether the training had a significant effect on weight reduction.",
                            "Apply Chi-square test to verify if vaccine efficacy is independent of patient age category in a 2x3 contingency table."
                        ]
                    }
                ]
            }
        ]
    },
    "software-engineering": {
        "id": "software-engineering",
        "title": "Software Engineering & Agile Methodologies",
        "code": "CS-SE",
        "description": "Software lifecycle models, design principles, testing strategies, Agile manifesto, and Scrum/XP practices.",
        "textbooks": [
            "Ian Sommerville, 'Software Engineering', Pearson Education, 8th Edition, 2008",
            "Craig Larman, 'Agile and Iterative Development—A Manager's Guide', Pearson Education, 2010"
        ],
        "units": [
            {
                "unit_number": "UNIT-I",
                "title": "SOFTWARE ENGINEERING PROCESSES",
                "periods": 9,
                "course_outcome": "CO1: Perform software engineering processes.",
                "topics": [
                    {
                        "name": "Software Lifecycle Models & Project Management",
                        "subtopics": [
                            "Software engineering concepts and development activities",
                            "Software Development Lifecycle Models (SDLC): Waterfall, Prototyping, Incremental, Spiral Model, V-Model",
                            "Software Project Management: Planning, Estimation, Scheduling, Risk Management",
                            "Software Configuration Management (SCM) & Version control",
                            "Empirical Estimation Techniques: COCOMO I & II, Function Point Analysis (FPA)",
                            "Staffing level estimation and Organization team structures",
                            "Software Requirements Specification (SRS) standards (IEEE 830)"
                        ],
                        "sample_questions": [
                            "Compare the Waterfall model with the Spiral model. For what type of projects is each suited?",
                            "Explain COCOMO model with Basic, Intermediate, and Detailed estimation formulas."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-II",
                "title": "SOFTWARE DESIGN",
                "periods": 9,
                "course_outcome": "CO2: Make use of software design and UML modeling.",
                "topics": [
                    {
                        "name": "Design Principles & UML Modeling",
                        "subtopics": [
                            "Characteristics of Good Software Design (Modularity, Understandability, Extensibility)",
                            "Coupling (Content, Common, Control, Stamp, Data) and Cohesion (Coincidental, Logical, Temporal, Procedural, Communicational, Sequential, Functional)",
                            "Structured Analysis and Data Flow Diagrams (DFD Level 0, 1, 2)",
                            "UML Diagrams: Use Case diagrams, Class diagrams, Sequence and Interaction diagrams, Activity diagrams, State Machine diagrams",
                            "User Interface Design Principles: Golden rules of UI, User-centered design"
                        ],
                        "sample_questions": [
                            "Explain Coupling and Cohesion in detail with types from best to worst.",
                            "Draw a complete Use Case and Class diagram for an Online Food Delivery or Hospital Management System."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-III",
                "title": "SOFTWARE TESTING",
                "periods": 9,
                "course_outcome": "CO3: Apply different software testing strategies.",
                "topics": [
                    {
                        "name": "Testing Principles & Lifecycle",
                        "subtopics": [
                            "Introduction to Software Testing & Psychology of Testing",
                            "Principles of Software Testing (Testing shows presence of defects, Exhaustive testing is impossible, Early testing)",
                            "Defects, Errors, Bugs, and Defect Prevention Strategies",
                            "Role of a Software Tester vs Developer",
                            "Software Testing Life Cycle (STLC)",
                            "White-Box Testing: Basis Path Testing, Cyclomatic Complexity, Condition Coverage",
                            "Black-Box Testing: Equivalence Class Partitioning, Boundary Value Analysis (BVA), Decision Table testing",
                            "Levels of Testing: Unit, Integration, System, Acceptance (Alpha/Beta)"
                        ],
                        "sample_questions": [
                            "Explain Boundary Value Analysis and Equivalence Partitioning with a practical test case generation example.",
                            "Calculate the Cyclomatic Complexity for a given control flow graph using three different methods."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-IV",
                "title": "AGILE METHODOLOGY",
                "periods": 9,
                "course_outcome": "CO4: Illustrate different Agile methodologies.",
                "topics": [
                    {
                        "name": "Agile Principles & Management",
                        "subtopics": [
                            "Theories for Agile Management",
                            "Agile Software Development vs Traditional Waterfall Model",
                            "Classification of Agile Methods",
                            "Agile Manifesto: 4 Core Values and 12 Principles",
                            "Agile Project Management & Team Interactions",
                            "Ethics in Agile Teams and Agility in Design and Testing",
                            "Agile Documentation and Drivers"
                        ],
                        "sample_questions": [
                            "State the 4 core values and 12 principles of the Agile Manifesto.",
                            "Compare Traditional Plan-Driven Development with Agile Development across requirements, delivery, and team roles."
                        ]
                    }
                ]
            },
            {
                "unit_number": "UNIT-V",
                "title": "AGILE PROCESSES",
                "periods": 9,
                "course_outcome": "CO5: Make use of different processes of Agile methodology.",
                "topics": [
                    {
                        "name": "Scrum, XP & Lean Implementations",
                        "subtopics": [
                            "Lean Production principles in software",
                            "SCRUM Framework: Roles (Product Owner, Scrum Master, Team), Artifacts (Product Backlog, Sprint Backlog, Increment), Ceremonies (Sprint Planning, Daily Standup, Sprint Review, Retrospective)",
                            "Crystal Methodologies and Feature Driven Development (FDD)",
                            "Adaptive Software Development (ASD)",
                            "Extreme Programming (XP): Values, Practices (Pair Programming, TDD, Continuous Integration, Refactoring, Collective Code Ownership)"
                        ],
                        "sample_questions": [
                            "Explain the Scrum lifecycle in detail with its roles, ceremonies, and artifacts.",
                            "Explain the core engineering practices of Extreme Programming (XP), emphasizing Pair Programming and Test-Driven Development (TDD)."
                        ]
                    }
                ]
            }
        ]
    }
}

class SyllabusService:
    @classmethod
    def get_all_courses(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": c["id"],
                "title": c["title"],
                "code": c["code"],
                "description": c["description"],
                "total_units": len(c["units"]),
                "textbooks_count": len(c["textbooks"])
            }
            for c in COURSES_SYLLABUS_DB.values()
        ]

    @classmethod
    def get_course_detail(cls, course_id: str) -> Optional[Dict[str, Any]]:
        # Match by id or title substring
        cid = course_id.lower().strip()
        if cid in COURSES_SYLLABUS_DB:
            return COURSES_SYLLABUS_DB[cid]
        for key, course in COURSES_SYLLABUS_DB.items():
            if cid in key or cid in course["title"].lower():
                return course
        return None

    @classmethod
    async def answer_syllabus_question(
        cls,
        course_title: str,
        unit_title: str,
        topic_name: str,
        question: str
    ) -> Dict[str, Any]:
        """
        Generates detailed, structured academic answers with formulas, diagrams/code,
        and exam points, using LLM if available or deterministic academic knowledge base.
        """
        # 1. Try LLM if configured
        if settings.OPENAI_API_KEY:
            sys_prompt = (
                "You are an expert university professor and technical examiner for engineering courses. "
                "Provide a comprehensive, high-scoring university examination answer for the student's question. "
                "Structure the answer clearly with: "
                "1. Direct Definition / Core Concept (2-3 sentences) "
                "2. Mathematical Formulas / Architecture Diagram in ASCII or Markdown "
                "3. Step-by-Step Explanation / Algorithm Steps / Working Principle "
                "4. Numerical Example or Code Implementation (if applicable) "
                "5. Advantages, Disadvantages & Real-world Applications "
                "6. Key Points to Remember for Exams."
            )
            user_prompt = (
                f"Course: {course_title}\n"
                f"Unit: {unit_title}\n"
                f"Topic: {topic_name}\n"
                f"Question: {question}"
            )
            llm_res = await AITaskGenerator.call_llm(sys_prompt, user_prompt)
            if llm_res:
                return {
                    "question": question,
                    "course": course_title,
                    "topic": topic_name,
                    "source": "AI Professor Engine",
                    "answer": llm_res
                }

        # 2. Comprehensive Deterministic Knowledge Fallback
        q_lower = question.lower()

        # Custom tailored answers for top university syllabus questions
        if "turing test" in q_lower:
            ans = (
                "### 1. Definition and Concept\n"
                "The **Turing Test**, proposed by Alan Turing in his 1950 seminal paper *'Computing Machinery and Intelligence'*, "
                "is an operational test for machine intelligence based on indistinguishability from human conversational behavior.\n\n"
                "### 2. Setup and Test Protocol\n"
                "```\n"
                "+------------------+        +-------------------+\n"
                "| Human Interrogator| <---> | Computer / AI (A) |\n"
                "|       (C)        |        +-------------------+\n"
                "|                  | <---> | Human Responder(B)|\n"
                "+------------------+        +-------------------+\n"
                "```\n"
                "- A human interrogator (C) communicates via text terminal with two hidden parties: a human (B) and a computer program (A).\n"
                "- If the interrogator cannot reliably tell which party is the computer after 5 minutes of open-ended conversation, the machine passes.\n\n"
                "### 3. Key Capabilities Required to Pass\n"
                "1. **Natural Language Processing (NLP)**: To communicate fluently in human language.\n"
                "2. **Knowledge Representation**: To store world facts, common sense, and context.\n"
                "3. **Automated Reasoning**: To answer questions and draw valid logical inferences.\n"
                "4. **Machine Learning**: To adapt to new circumstances and detect patterns.\n\n"
                "### 4. Limitations and Criticisms\n"
                "- **John Searle's Chinese Room Argument**: Simulating understanding is not equivalent to true consciousness or intentionality.\n"
                "- **Deception-Oriented**: Rewards chatbot tricks and diversion over genuine scientific reasoning."
            )
        elif "bayes" in q_lower:
            ans = (
                "### 1. Statement of Bayes' Theorem\n"
                "Bayes' Theorem provides a mathematical formula for calculating the conditional probability of an event given prior knowledge of conditions related to the event:\n\n"
                "$$\\mathbf{P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}}$$\n\n"
                "Where:\n"
                "- **P(A|B)**: Posterior Probability (Probability of hypothesis A given evidence B).\n"
                "- **P(B|A)**: Likelihood (Probability of observing evidence B given hypothesis A is true).\n"
                "- **P(A)**: Prior Probability (Initial probability of hypothesis A before evidence).\n"
                "- **P(B)**: Marginal Probability of Evidence (Total probability: $\\sum P(B|A_i) P(A_i)$).\n\n"
                "### 2. Derivation\n"
                "From conditional probability definition:\n"
                "1. $P(A \\cap B) = P(A|B) \\cdot P(B)$\n"
                "2. $P(A \\cap B) = P(B|A) \\cdot P(A)$\n"
                "Equating both equations:\n"
                "$P(A|B) \\cdot P(B) = P(B|A) \\cdot P(A) \\implies P(A|B) = \\frac{P(B|A) P(A)}{P(B)}$\n\n"
                "### 3. Engineering Applications\n"
                "- **Spam Filtering**: Naive Bayes classification based on word frequencies.\n"
                "- **Medical Diagnostics**: Disease likelihood given positive test symptoms."
            )
        elif "a*" in q_lower or "a star" in q_lower or "algorithm" in q_lower and "search" in q_lower:
            ans = (
                "### 1. A* Algorithm Principle\n"
                "The **A* (A-Star) search algorithm** is an informed, best-first graph search algorithm that finds the shortest path between a start node and a goal node by evaluating nodes using an evaluation function:\n\n"
                "$$\\mathbf{f(n) = g(n) + h(n)}$$\n\n"
                "- **g(n)**: Exact cost incurred from the start node to current node $n$.\n"
                "- **h(n)**: Estimated heuristic cost from node $n$ to the goal node.\n"
                "- **f(n)**: Estimated total cost of cheapest solution path through node $n$.\n\n"
                "### 2. Optimality Conditions\n"
                "- **Admissibility**: A heuristic $h(n)$ is admissible if it never overestimates the actual cost to reach the goal: $h(n) \\le h^*(n)$.\n"
                "- **Consistency (Monotonicity)**: For every node $n$ and successor $n'$, $h(n) \\le c(n, a, n') + h(n')$.\n"
                "- **Theorem**: If $h(n)$ is admissible, tree-search A* is optimal. If $h(n)$ is consistent, graph-search A* is optimal and never needs to reopen closed nodes."
            )
        elif "scrum" in q_lower or "agile" in q_lower:
            ans = (
                "### 1. Scrum Framework Overview\n"
                "**Scrum** is an iterative, incremental agile process framework for managing complex product development through short, fixed-length sprints (typically 1 to 4 weeks).\n\n"
                "### 2. Core Scrum Pillars\n"
                "1. **Transparency**: Significant aspects of the process must be visible to those responsible for the outcome.\n"
                "2. **Inspection**: Scrum users must frequently inspect Scrum artifacts to detect undesirable variances.\n"
                "3. **Adaptation**: If a process deviates outside acceptable limits, the process or material must be adjusted.\n\n"
                "### 3. The 3 Scrum Roles\n"
                "- **Product Owner (PO)**: Manages product backlog, prioritizes user stories, maximizes business value.\n"
                "- **Scrum Master**: Servant leader who enforces Scrum rules, removes team blockers/impediments.\n"
                "- **Development Team**: Cross-functional, self-organizing engineers delivering shippable increments.\n\n"
                "### 4. The 4 Scrum Ceremonies\n"
                "- **Sprint Planning**: Select backlog items for sprint goal.\n"
                "- **Daily Standup (Scrum)**: 15-min daily sync (Yesterday, Today, Blockers).\n"
                "- **Sprint Review**: Demo completed increment to stakeholders.\n"
                "- **Sprint Retrospective**: Team inspects how the sprint went and commits to process improvements."
            )
        else:
            ans = (
                f"### Core Overview of {topic_name}\n"
                f"**Question:** {question}\n\n"
                f"**1. Theoretical Foundation:**\n"
                f"In {course_title} ({unit_title}), **{topic_name}** represents a fundamental pillar tested in university examinations. "
                "Understanding its core definition, mathematical principles, and practical application ensures high marks.\n\n"
                "**2. Key Structural Components:**\n"
                "- **Objective**: Master the theoretical mechanisms and standard algorithms.\n"
                "- **Properties**: High reliability, systematic bounds, and standardized problem-solving procedures.\n"
                "- **Evaluation Criteria**: Time complexity, space bounds, accuracy, and fault mitigation.\n\n"
                "**3. Examination Answer Guidelines:**\n"
                "- Begin with a concise 2-line definition.\n"
                "- Draw a labeled block diagram or state space graph.\n"
                "- Write step-by-step mathematical derivation or pseudo-code.\n"
                "- Conclude with 2 real-world applications and trade-offs."
            )

        return {
            "question": question,
            "course": course_title,
            "topic": topic_name,
            "source": "Orbit OS Academic Engine",
            "answer": ans
        }
