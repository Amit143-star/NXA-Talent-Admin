/**
 * NXA Talent — 50 Projects Matrix Seeder (Zero Dependencies)
 * 
 * Authenticates via service account key to seed exactly 50 high-quality 
 * industrial projects focusing heavily on AI, AIML, and AIDS, plus Full-stack and Systems.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'serviceAccountKey.json'), 'utf8')
);

// 50 High-fidelity project items
const projects = [
  // --- AI, ML, AIDS (1 to 25) ---
  {
    title: "Neural Traffic Flow Optimisation Engine",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=600&q=80",
    info: "An AI-driven real-time video telemetry analysis pipeline that optimizes city traffic grid timings based on edge camera density metrics. It detects vehicle counts per lane using YOLOv8 models at the edge and updates signal durations over high-speed queues.",
    source: "https://github.com/topics/traffic-control",
    dataset: "https://www.kaggle.com/datasets?search=traffic+sensor"
  },
  {
    title: "Predictive Smart Grid Asset Maintenance",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80",
    info: "High-throughput telemetry ingestion platform utilizing Random Forest modeling to predict substation transformer failures before critical load faults occur. It evaluates transformer insulation health based on continuous readings of oil moisture, load current, and winding temperature.",
    source: "https://github.com/topics/smart-grid",
    dataset: "https://www.kaggle.com/datasets?search=electrical+grid"
  },
  {
    title: "Holographic Audio Waveform Enhancer",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    info: "Deep learning convolution models to de-noise industrial microphone logs and reconstruct lost spatial sound vectors in high-decibel workspaces. The pipeline utilizes a 1D Convolutional Autoencoder to filter machine operating sound samples and highlight mechanical wear signs.",
    source: "https://github.com/topics/audio-denoising",
    dataset: "https://www.kaggle.com/datasets?search=industrial+noise"
  },
  {
    title: "Computer Vision Warehouse Sorting Arm",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80",
    info: "An AIML-based robot arm control interface that uses object segmentation algorithms to classify, route, and sort parcels by size and labeling. The vision script processes color depth frames and generates XYZ spatial coordinate offsets for mechanical actuators.",
    source: "https://github.com/topics/robotic-arm",
    dataset: "https://www.kaggle.com/datasets?search=object-detection"
  },
  {
    title: "Autonomous Lung Anomaly Classifier",
    image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=600&q=80",
    info: "A healthcare AIDS project implementing a ResNet50 Convolutional Neural Network trained to detect anomalies in chest X-ray images. The web-based classifier runs inference to flag high-probability nodules, assisting doctors in screening lung congestions rapidly.",
    source: "https://github.com/topics/medical-imaging",
    dataset: "https://www.kaggle.com/datasets?search=chest-xray"
  },
  {
    title: "Real-time Sign Language Translator",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    info: "An interactive computer-vision app that tracks hand gestures using MediaPipe and maps them to text output using an LSTM neural network. The translator outputs translated vocabulary in real-time on screen to aid communication for hearing-impaired users.",
    source: "https://github.com/topics/gesture-recognition",
    dataset: "https://www.kaggle.com/datasets?search=sign-language"
  },
  {
    title: "Intelligent Crop Disease Diagnosis System",
    image: "https://images.unsplash.com/photo-1463123081488-72993af4de33?auto=format&fit=crop&w=600&q=80",
    info: "A mobile agriculture diagnostics tool running lightweight MobileNetV3 models to scan plant leaves and pinpoint crop diseases. It operates offline on edge mobile devices, alerting farmers immediately to blight, rot, or insect infestation markers.",
    source: "https://github.com/topics/agriculture-ai",
    dataset: "https://www.kaggle.com/datasets?search=plant-village"
  },
  {
    title: "Customer Churn Prediction Dashboard",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
    info: "A marketing analytics data science platform that executes XGBoost predictive trees to identify customers at risk of leaving a subscription service. It displays risk scores, active feature importances, and triggers automated retention email campaigns.",
    source: "https://github.com/topics/churn-prediction",
    dataset: "https://www.kaggle.com/datasets?search=telecom-churn"
  },
  {
    title: "Conversational Financial Advisor Chatbot",
    image: "https://images.unsplash.com/photo-1598257006458-087169a1f08d?auto=format&fit=crop&w=600&q=80",
    info: "An NLP-powered chatbot running a customized Llama-2 transformer model trained on public financial reports. It provides users with context-aware stock summaries, answers portfolio query parameters, and executes sentiment analysis on current market news.",
    source: "https://github.com/topics/financial-chatbot",
    dataset: "https://www.kaggle.com/datasets?search=financial-news"
  },
  {
    title: "Dynamic E-Commerce Recommendation Matrix",
    image: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=600&q=80",
    info: "A data science recommender system using collaborative filtering and matrix factorization to suggest retail products in real-time. It monitors user clicks, cart actions, and purchases, recalculating user-item similarity weights asynchronously.",
    source: "https://github.com/topics/recommendation-engine",
    dataset: "https://www.kaggle.com/datasets?search=ecommerce-behavior"
  },
  {
    title: "Deep Learning License Plate Recognizer",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80",
    info: "An automated tollgate security system utilizing OpenCV and CRNN (Convolutional Recurrent Neural Network) to detect and extract characters from car license plates. The pipeline operates under fluctuating speeds, writing logs into a centralized Postgres server.",
    source: "https://github.com/topics/license-plate-recognition",
    dataset: "https://www.kaggle.com/datasets?search=car-plates"
  },
  {
    title: "Stock Price Volatility Forecasting Engine",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
    info: "A high-frequency trading forecasting tool utilizing GARCH and LSTM models to predict stock price volatility intervals. It consumes streaming WebSockets from market exchanges, displaying probability envelopes and risk boundaries on graphs.",
    source: "https://github.com/topics/stock-forecasting",
    dataset: "https://www.kaggle.com/datasets?search=stock-market"
  },
  {
    title: "Social Media Hate Speech Filter",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    info: "An NLP toxicity classification model built using DistilBERT to classify and filter offensive content in user comments. The service operates inside a high-throughput API gateway, blocking toxic messages before database commits occur.",
    source: "https://github.com/topics/sentiment-analysis",
    dataset: "https://www.kaggle.com/datasets?search=toxic-comments"
  },
  {
    title: "Intelligent Document Parsing OCR",
    image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80",
    info: "An automated document processor utilizing LayoutLM models to parse unstructured invoices, scan receipts, and extract table fields. The OCR engine exports parsed values directly into standardized JSON files for banking ledger records.",
    source: "https://github.com/topics/layoutlm",
    dataset: "https://www.kaggle.com/datasets?search=invoice-ocr"
  },
  {
    title: "Cyber Fraud Network Graph Analyzer",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    info: "An AIDS threat analyzer implementing Graph Convolutional Networks (GCN) to detect shell bank accounts and credit card fraud circles. It processes transactions as edges between node profiles, flagging cyclic transfer graphs.",
    source: "https://github.com/topics/fraud-detection",
    dataset: "https://www.kaggle.com/datasets?search=credit-card-fraud"
  },
  {
    title: "Self-Driving Car Lane Detection Pipeline",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    info: "A computer vision self-driving model using Hough Transform filters and sliding window histograms to identify highway lane markings in real-time. It maps lane boundaries, steering angles, and yaw offsets from dashcam feeds.",
    source: "https://github.com/topics/lane-detection",
    dataset: "https://www.kaggle.com/datasets?search=self-driving-data"
  },
  {
    title: "Industrial Machinery Anomaly Autoencoder",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80",
    info: "An unsupervised ML project using LSTM Autoencoders to monitor multi-axis vibration logs in assembly plant motors. It isolates micro-fractures and bearing degradation by identifying anomalies that exceed reconstruction error limits.",
    source: "https://github.com/topics/anomaly-detection",
    dataset: "https://www.kaggle.com/datasets?search=bearing-vibration"
  },
  {
    title: "Product Quality Vision Inspector",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    info: "A computer vision quality control engine running YOLOv8 classification loops on high-speed conveyor cameras. It isolates surface scratches, dents, and dimensional deviations in manufactured metal parts in under 10ms.",
    source: "https://github.com/topics/defect-detection",
    dataset: "https://www.kaggle.com/datasets?search=surface-defects"
  },
  {
    title: "Dynamic Pricing Optimisation Model",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    info: "A reinforcement learning system designed to optimize pricing parameters for online ride-sharing services. It processes supply density, historic booking ratios, and local weather patterns to adjust fares continuously.",
    source: "https://github.com/topics/dynamic-pricing",
    dataset: "https://www.kaggle.com/datasets?search=taxi-demands"
  },
  {
    title: "Clinical Patient Readmission Predictor",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
    info: "A clinical decision support model using Logistic Regression and Decision Trees to evaluate patient hospital readmission probabilities. It processes historic diagnoses, medications, and age parameters to flag high-risk discharges.",
    source: "https://github.com/topics/healthcare-analytics",
    dataset: "https://www.kaggle.com/datasets?search=hospital-readmission"
  },
  {
    title: "Real-time Speech Sentiment Analyzer",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80",
    info: "An AIML voice analytics pipeline that extracts Mel-Frequency Cepstral Coefficients (MFCC) from microphone audio, running classifier trees to categorize user emotional states (calm, angry, stressed) in support call centers.",
    source: "https://github.com/topics/speech-emotion",
    dataset: "https://www.kaggle.com/datasets?search=audio-sentiment"
  },
  {
    title: "Large Language Model Code Synthesizer",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    info: "A code generation plugin utilizing a fine-tuned GPT model that autocompletes boilerplates and database queries based on standard comments. It operates on developer inputs inside code environments to speed up development pipelines.",
    source: "https://github.com/topics/code-generator",
    dataset: "https://www.kaggle.com/datasets?search=github-code"
  },
  {
    title: "Biometric Facial Recognition Door Lock",
    image: "https://images.unsplash.com/photo-1509822929063-6b6cfc9b42f2?auto=format&fit=crop&w=600&q=80",
    info: "A physical door security interface running FaceNet embeddings on local cameras. It matches facial vectors against database profiles, unlocking mechanical relays when similarity matches exceed 95% threshold ratios.",
    source: "https://github.com/topics/facial-recognition",
    dataset: "https://www.kaggle.com/datasets?search=face-embeddings"
  },
  {
    title: "Autonomous Stock Inventory Forecaster",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    info: "A logistics inventory planning engine running Prophet time-series models to predict warehouse SKU demand cycles. It evaluates order rates and holiday patterns to generate automated vendor replenish alerts.",
    source: "https://github.com/topics/time-series",
    dataset: "https://www.kaggle.com/datasets?search=demand-forecasting"
  },
  {
    title: "Semantic Image Search Engine",
    image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
    info: "An advanced search system built using CLIP (Contrastive Language-Image Pretraining) to retrieve photographs from databases using standard language descriptions, mapping sentence vectors to image vector coordinates.",
    source: "https://github.com/topics/vector-search",
    dataset: "https://www.kaggle.com/datasets?search=image-embeddings"
  },

  // --- Full-Stack Web & Mobile Applications (26 to 40) ---
  {
    title: "Supply Chain Logistics Route Optimizer",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    info: "Genetic algorithm routing model executing dynamic VRP solving to optimize final-mile truck cargo drops under fluctuating highway transit conditions. The engine exposes coordinates lists over API controllers to local drivers.",
    source: "https://github.com/topics/route-optimization",
    dataset: "https://www.kaggle.com/datasets?search=vehicle+routing"
  },
  {
    title: "Decentralized P2P Messaging Portal",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80",
    info: "A secure, serverless messaging application utilizing WebRTC connection protocols to transfer end-to-end encrypted files. Users discover connections via a distributed signaling network, bypassing central cloud data storage.",
    source: "https://github.com/topics/webrtc-chat",
    dataset: "https://www.kaggle.com/datasets?search=chat-logs"
  },
  {
    title: "Micro-SaaS Billing Subscription Engine",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    info: "A full-stack Node-based billing dashboard integrated with Stripe webhooks. It handles recurring pricing tires, processes invoice histories, and automatically suspends accounts when credit card payments fail twice.",
    source: "https://github.com/topics/stripe-billing",
    dataset: "https://www.kaggle.com/datasets?search=saas-metrics"
  },
  {
    title: "Interactive Markdown EdTech Canvas",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    info: "A collaborative education board that compiles markdown files, slides, and math equations inside browser views. It supports real-time editing rooms using Yjs conflict-free replicated data structures.",
    source: "https://github.com/topics/edtech-platform",
    dataset: "https://www.kaggle.com/datasets?search=student-engagement"
  },
  {
    title: "Peer-to-Peer Car Sharing Mobile App",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80",
    info: "A React Native application linking vehicle owners with renters. It implements GPS coordinate mapping, secure credit card transactions, driver license OCR verification, and remote lock/unlock Bluetooth commands.",
    source: "https://github.com/topics/car-sharing",
    dataset: "https://www.kaggle.com/datasets?search=car-rental"
  },
  {
    title: "Real-time Multi-tenant Project Dashboard",
    image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
    info: "An enterprise project manager with drag-and-drop Kanban panels. It uses Socket.io to synchronize board configurations across active team members instantly, logging audit trails in a PostgreSQL database.",
    source: "https://github.com/topics/kanban-board",
    dataset: "https://www.kaggle.com/datasets?search=project-tasks"
  },
  {
    title: "Telemedicine Patient Portal App",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
    info: "A healthcare web app allowing patients to schedule virtual consults, view digital prescription files, and chat with doctors. It complies with health security protocols by encrypting records at rest using AES-256 keys.",
    source: "https://github.com/topics/telemedicine",
    dataset: "https://www.kaggle.com/datasets?search=medical-consults"
  },
  {
    title: "Decentralized Crowdfunding Platform",
    image: "https://images.unsplash.com/photo-1538356111088-75a8591c6e6c?auto=format&fit=crop&w=600&q=80",
    info: "A web application linking founders directly with donors. It compiles blockchain smart contracts to manage contribution funds, automatically returning deposits if the minimum funding goals are not reached.",
    source: "https://github.com/topics/crowdfunding",
    dataset: "https://www.kaggle.com/datasets?search=charity-transactions"
  },
  {
    title: "Automated Social Media Post Scheduler",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    info: "A SaaS tool integrating LinkedIn and Twitter APIs to queue posting blocks. It runs background workers that publish articles, tracks engagement clicks, and compiles reports on follower growth charts.",
    source: "https://github.com/topics/buffer-clone",
    dataset: "https://www.kaggle.com/datasets?search=social-reach"
  },
  {
    title: "Personal Finance Expense Aggregator",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    info: "A financial tracker app that pulls transaction histories from banks using API credentials, grouping expenses by categories (food, rent, travel) and displaying monthly budget forecast graphs.",
    source: "https://github.com/topics/personal-finance",
    dataset: "https://www.kaggle.com/datasets?search=bank-transactions"
  },
  {
    title: "Collaborative Coding Playground IDE",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    info: "A web-based IDE allowing multiple engineers to write code together in the browser. It executes scripts inside secure Docker containers on the server, returning output logs to the browser console.",
    source: "https://github.com/topics/online-compiler",
    dataset: "https://www.kaggle.com/datasets?search=code-execution"
  },
  {
    title: "Smart Gym Workout Tracker App",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    info: "A mobile workout logger tracking muscle group volumes and sets. It includes video form reference sheets, computes 1-rep-max graphs, and lets users share workout logs with fitness coaches.",
    source: "https://github.com/topics/fitness-tracker",
    dataset: "https://www.kaggle.com/datasets?search=exercise-routines"
  },
  {
    title: "Real-time Auction Bidding Platform",
    image: "https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&w=600&q=80",
    info: "An online auction portal executing bidding processes using Redis WebSockets. It syncs active bids, calculates time limits, and closes sales, locking bids to prevent race conditions during peak loads.",
    source: "https://github.com/topics/auction-engine",
    dataset: "https://www.kaggle.com/datasets?search=bid-histories"
  },
  {
    title: "E-Learning Course Market Portal",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    info: "A course store web app showcasing training videos and modules. It tracks video viewing progress, manages student assignments, compiles certifications, and triggers automated email reminders.",
    source: "https://github.com/topics/elearning",
    dataset: "https://www.kaggle.com/datasets?search=course-completions"
  },
  {
    title: "Distributed Task Management Queue",
    image: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
    info: "A worker engine implementing BullMQ and Redis to execute scheduled tasks (image compression, emails). It features a dashboard displaying active, waiting, and failed task counters.",
    source: "https://github.com/topics/task-queue",
    dataset: "https://www.kaggle.com/datasets?search=worker-jobs"
  },

  // --- Cloud, IoT, Security, Blockchain, Systems (41 to 50) ---
  {
    title: "Cyber-Threat Ingestion & Profiling Firewall",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    info: "Real-time Netflow ingestion script extracting host attributes, packet size ratios, and clustering vectors to automatically detect zero-day root port sweeps and block IPs via iptables commands.",
    source: "https://github.com/topics/intrusion-detection",
    dataset: "https://www.kaggle.com/datasets?search=network+security"
  },
  {
    title: "Kubernetes Cluster Performance Monitor",
    image: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=600&q=80",
    info: "A cloud monitoring dashboard utilizing Prometheus APIs to track pod CPU limits, memory allocations, and network errors across multi-node Kubernetes clusters, firing warnings to Slack webhooks.",
    source: "https://github.com/topics/kubernetes-monitoring",
    dataset: "https://www.kaggle.com/datasets?search=kubernetes-metrics"
  },
  {
    title: "Smart Thermostat IoT Gateway",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80",
    info: "An IoT client script running on Raspberry Pi nodes reading ambient temperature registers and publishing them to an AWS IoT Core broker, allowing users to adjust home thermostat settings remotely.",
    source: "https://github.com/topics/iot-gateway",
    dataset: "https://www.kaggle.com/datasets?search=room-temperatures"
  },
  {
    title: "Decentralized Logistics Blockchain Ledger",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    info: "A supply chain tracing system using smart contracts on an Ethereum ledger. It logs parcel drop handoffs, temperature history, and time checks, preventing data fraud in cargo shipping.",
    source: "https://github.com/topics/supply-chain-blockchain",
    dataset: "https://www.kaggle.com/datasets?search=blockchain-transactions"
  },
  {
    title: "Automated API DevSecOps Scanner",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    info: "A CI/CD scanner script checking GitHub commits for leaked credentials, SQL injections, and outdated dependencies. It runs static analysis checks and blocks pull requests if bugs are found.",
    source: "https://github.com/topics/devsecops",
    dataset: "https://www.kaggle.com/datasets?search=dependency-vulns"
  },
  {
    title: "Multi-Node Load Balancer Proxy",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80",
    info: "A reverse proxy server written in Node.js that routes requests across multiple application instances using a Round-Robin algorithm. It performs health checks and drops unresponsive nodes.",
    source: "https://github.com/topics/load-balancer",
    dataset: "https://www.kaggle.com/datasets?search=proxy-logs"
  },
  {
    title: "Distributed Cache Synchronization Node",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    info: "A distributed caching project using Raft consensus rules to sync variables across cluster nodes, ensuring memory state matches without database query locks during write phases.",
    source: "https://github.com/topics/raft-consensus",
    dataset: "https://www.kaggle.com/datasets?search=distributed-hash"
  },
  {
    title: "Micro-Sensor Soil Ingestion Hub",
    image: "https://images.unsplash.com/photo-1463123081488-72993af4de33?auto=format&fit=crop&w=600&q=80",
    info: "An agricultural sensor gateway reading soil nitrogen, phosphorus, and moisture ratios. It runs analytics to generate smart irrigation volumes and transmits them to water pump micro-relays.",
    source: "https://github.com/topics/smart-irrigation",
    dataset: "https://www.kaggle.com/datasets?search=soil-moisture"
  },
  {
    title: "Distributed Server Log Aggregator",
    image: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=600&q=80",
    info: "A logging utility implementing Elasticsearch to parse and index log outputs from microservices in real-time, grouping error trace vectors by application and displaying volumes on grids.",
    source: "https://github.com/topics/log-analyzer",
    dataset: "https://www.kaggle.com/datasets?search=web-server-logs"
  },
  {
    title: "Automated Database Failover Coordinator",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    info: "A database driver coordinator that monitors primary PostgreSQL nodes. If heartbeat drops occur, it executes shell scripts promoting replicas to primary status and updates connection strings.",
    source: "https://github.com/topics/database-failover",
    dataset: "https://www.kaggle.com/datasets?search=postgres-heartbeat"
  }
];

// Helper to make HTTPS requests
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: parsed.error || parsed });
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, raw: data });
          } else {
            resolve(data);
          }
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Generate OAuth2 token using service account JWT signing
async function getAccessToken() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat
  };

  const base64Encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${base64Encode(header)}.${base64Encode(payload)}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${unsignedToken}.${signature}`;

  const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

  const res = await request({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }, postData);

  return res.access_token;
}

// Seed a single project document
async function seedProject(token, proj) {
  const projId = serviceAccount.project_id;
  const docId = proj.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const docPath = `/v1/projects/${projId}/databases/(default)/documents/projects/${encodeURIComponent(docId)}`;

  console.log(`Writing project: ${proj.title}...`);

  await request({
    hostname: 'firestore.googleapis.com',
    path: docPath + '?updateMask.fieldPaths=title&updateMask.fieldPaths=image&updateMask.fieldPaths=info&updateMask.fieldPaths=source&updateMask.fieldPaths=dataset',
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }, {
    fields: {
      title: { stringValue: proj.title },
      image: { stringValue: proj.image },
      info: { stringValue: proj.info },
      source: { stringValue: proj.source },
      dataset: { stringValue: proj.dataset }
    }
  });

  console.log(`✅ Seeded: ${proj.title}`);
}

async function main() {
  console.log('\n🚀 NXA Talent — Seeding 50 Premium Projects\n');
  
  try {
    const token = await getAccessToken();
    console.log('🔑 Successfully authenticated with Google OAuth2 API.\n');
    
    // Clear/Update projects
    for (const proj of projects) {
      await seedProject(token, proj);
      console.log('');
    }
    
    console.log('🎉 Seeding successfully completed! 50 Projects are live in the matrix.\n');
  } catch (err) {
    console.error('Fatal error during execution:', err);
    process.exit(1);
  }
}

main();
