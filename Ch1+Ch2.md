# Chapter 1: Introduction

## 1.1 Background and Domain Context

One of the main drives behind the digital age is expanding access to knowledge of people, regardless of their living circumstances. Throughout the exponential development of technology that is from the period of early online forums to modern comprehensive course platforms, it has always attempted to lower the barrier between those who possess a skill or an expertise in a certain field and those who whish to acquire one. However, agains this massive movement, a structural weakness arises when considering how formal educational tools tend to impede the process of information sharing because of its rigid, asynchronous, and impersonal aspects. On the other hand, informal social platforms do exist in response to the increasing demand for making skill mastery more entertaining and personal, but they lack the organization, accountability, and structured progression essential for meaningful skill development.

The practice of individuals, who share at least one commonality whether it be belonging in the same age group, having the same mental state, or any other bond, teaching and learning from one another rather than fixed instructor-student method, has long been recognized in educational research as a highly effective modality. Studies in cooperative learning theory, such as the notable work of Johnson and Johson (1989) on collaborative learning structures, show that not only does teaching a skill strengthen a peer's own abilities, but it also renders the learner more capable of grasping the explanation or core material when compared to learning from a textbook or a lecture. On another level, the trust, shared experience, and mutual accountability spurred out of this exchange is difficult to replicate in purely transactional learning environments.

Mobile computing has further shifted the landscape. As smartphones have infiltrated in every sector of the economy and due to its high rate of global usage and demand, bulding a mobile-first application is no longer a design luxury but a baseline expectation. Learners expect to access content, communicate with
peers, and track their progress from the same device they use for everything else. This expectation places mobile application development at the center of any serious attempt to build a peer-to-peer learning platform with broad reach.

Within this context, the domain of skill-sharing applications sits at the intersection of social networking, educational technology (EdTech), and collaborative software. A platform in this space must simultaneously solve problems that belong to each of these fields: identity and trust (social networking), content organization and progression (EdTech), and coordination and communication (collaborative software). No single existing solution addresses all three in a cohesive, mobile-first package, and this gap forms the foundational motivation for SkillSwap.

## 1.2 Motivation

The formation of the core concept behind SkillSwap arose from a straightforward observation: people in general and friend groups in particular possess skills that others would pay or trade in order to acquire. However, the facilities to accomplish such an exchange in an interactive, accountable, and non-formal but organized way does not exist at the individual or small-group level without significant friction and overhead.

Existing platforms serve parts of this need. Tutoring marketplaces such as Preply or Wyzant connect students with paid tutors, but they are transactional rather than reciprocal, the teacher is always a professional, the learner always a customer. There is no mechanism for a learner in one domain to become a teacher in another within the same platform. Video-based platforms such as YouTube or Skillshare provide enormous breadth of content, but they are passive and asynchronous: there is no session scheduling, no group cohesion, no real-time Q&A grounded in the specific materials a teacher has prepared. General-purpose social platforms such as WhatsApp or Discord can host informal study groups, but they provide no structure, no role enforcement, no session artifacts, and no AI assistance.

SkillSwap was conceived to fill this gap. The motivating vision was a platform where a person who speaks for instance intermediate Spanish, could form a group, schedule sessions, upload vocabulary notes and grammar exercises as artifacts, and task an AI assistant with the demanding responsibility of answering learner questions specifically based on those uploaded materials. All of this could be realized while the person has simultaneously enrolled as a learner in a guitar group for instance, run by someone else. The reciprocity of roles, the structure of sessions, the grounding of AI responses in real course content, and the real-time communication layer together define a product that no existing solution currently provides.

From a technical standpoint, the project also presented a meaningful engineering challenge: building a production-grade mobile application that integrates a REST API, WebSocket communication, file storage, and a Retrieval-Augmented Generation (RAG) pipeline, all within a single cohesive system deployed and accessible at any time.

## 1.3 Scope

SkillSwap encompasses the following within its scope:

- **User management:** Registration, login, password reset via email, and a multi-step profile completion flow in which users declare the skills they wish to teach and the skills they wish to learn, along with personal information and a
  profile photograph.
- **Skill management:** A pre-populated catalogue of default skills and the ability for users to create custom skills. Each skill carries an icon, a name, and a default/custom flag. Skills are associated with users through a join table that records the user's role (teacher or learner) and their self-assessed proficiency level on a scale of one to five.
- **Group management:** Teachers can create skill-based groups with configurable visibility (public or private), difficulty level (beginner, intermediate, advanced), and a maximum participant cap. Learners can search for and request to join public groups. Teachers can invite friends with interest directly. A join-request approval workflow gives teachers control over group membership.
- **Session management:** Teachers can schedule sessions within their groups, specifying type (meeting, review, practice, or problem-solving), date, start time, end time, and any number of file artifacts. Learners can check in to sessions to record attendance. Teachers can mark sessions as completed or cancelled.
- **Real-time chat:** Each group has a persistent chat room accessible to all members. The teacher can pin messages, create polls (with configurable single or multiple-answer modes), and send broadcast notifications to all group members. Messages can be replied to with a quoted preview.
- **AI-powered Q&A:** Learners within a group can ask questions through a dedicated Q&A panel. The system retrieves semantically relevant passages from the group's uploaded session artifacts using vector embeddings and passes them as context to a large language model, ensuring answers are grounded in the specific course materials.
- **Social features:** Friend requests, friend acceptance and rejection, a user search function with recent search history, and public profile pages displaying skills, mutual friends, and friendship status.
- **Notification system:** Real-time in-app notifications for friend requests, group join requests, group invitations, session creation, and session cancellation,delivered via WebSocket to online users and stored persistently for offline users.

The following are explicitly **out of scope** for the current version:

- Video or audio calling between users.
- In application support for homework assignments.
- Review system to hanlde participant suggestions or general comments on the performance of the one teaching the skill.
- Creation of hieararchy within groups (membership - admin).

## 1.4 Report Roadmap

The remainder of this report is organized as follows.

**Chapter 2** formally states the project objectives, lists the functional and non-functional requirements, presents a use case overview, and concludes with a review of existing solutions that situates SkillSwap within the landscape of prior work and justifies the need for the system.

**Chapter 3** describes the overall system architecture and the backend design, covering the layered Express.js server structure, the organization of routes, controllers, services, and utilities, the authentication and middleware strategy, and the key engineering decisions made during API design.

**Chapter 4** is dedicated entirely to the database. It presents the full entity-relationship model, walks through every table in the schema, justifies the normalization decisions, describes the indexing strategy, and addresses data security considerations including row-level security policies on the Supabase storage layer.

**Chapter 5** covers the frontend design and user experience, describing the React Native component architecture, the navigation hierarchy, the design system (colors, typography, spacing), the state management approach using the Context API, and a detailed walkthrough of the key screens and the challenges encountered in building them.

**Chapter 6** examines the real-time subsystem, covering the Socket.IO architecture, the notification delivery pipeline for both online and offline users, the real-time chat system, and the integration of the WebSocket layer with the REST API.

**Chapter 7** is dedicated to the AI component. It documents the design and implementation of the Retrieval-Augmented Generation pipeline, from artifact ingestion and text extraction through chunk generation, embedding, vector storage, similarity search, and final answer generation via the Groq API.

**Chapter 8** concludes the report with a summary of what was built, an honest reflection on which objectives were met, the challenges and lessons learned, the limitations of the current system, and concrete proposals for future work.

# Chapter 2: Project Objectives and Existing Solutions

## 2.1 Project Objectives

SkillSwap was designed around a core set of objectives that guided every technical and design decision throughout development. These objectives are stated below in order of architectural priority.

**Objective 1 - Reciprocal Role System.**
Build a platform in which a single registered user can simultaneously hold the role of teacher in one or more skills and the role of learner in one or more other skills. The system must enforce role-appropriate permissions throughout, a learner in a group cannot create sessions, pin messages, or approve join requests; a teacher cannot vote in their own polls or use the Q&A assistant in the groups they run.

**Objective 2 - Structured Group and Session Lifecycle.**
Provide teachers with the tools to create skill-based groups, control membership through an approval workflow, schedule sessions with typed metadata (session type, date, time range), and attach file artifacts (PDF, Word, Excel, PowerPoint) to sessions. The system must track session attendance per participant.

**Objective 3 - Real-Time Communication.**
Implement a persistent group chat with real-time message delivery, reply threading, message pinning, poll creation and voting, and broadcast notifications, all synchronized across connected clients via WebSocket without requiring page refresh or manual polling.

**Objective 4 - AI-Assisted Learning Grounded in Course Materials.**
Deploy an AI Q&A system that answers learner questions exclusively based on the content of the artifacts uploaded by the teacher to that group's sessions. The AI must not hallucinate answers from general knowledge when the relevant information is absent from the course materials; it must instead explicitly acknowledge the gap.

**Objective 5 - Social Discovery Layer.**
Enable users to find other users by name, view public profiles including skill portfolios and mutual friends, send and manage friend requests, and leverage their friend network when populating new groups.

## 2.2 Functional Requirements

The functional requirements below are organized by domain area.

### Authentication and User Management

- FR-1: The system shall allow a new user to register with a full name, email address, and password. The password shall be hashed before storage using bcrypt with a salt factor of ten.
- FR-2: The system shall allow a registered user to log in with their email and password and receive a signed JSON Web Token (JWT) valid for seven days.
- FR-3: The system shall support a password reset flow in which a time-limited (one hour) reset token is emailed to the user, who can use it to set a new password via a dedicated screen in the mobile application.
- FR-4: After registration, the system shall require the user to complete their profile before accessing the main application. Profile completion shall collect nickname, date of birth, gender, biography, education level, a profile photograph, at least two skills to teach, and at least two skills to learn, each with a self-assessed proficiency level.
- FR-5: The system shall allow a user to update their profile photograph, biography, date of birth, gender, and education level at any time after profile completion.

### Skills

- FR-6: The system shall provide a pre-populated catalogue of default skills with associated icons.
- FR-7: The system shall allow any user to create a custom skill by providing a name and selecting an icon from a searchable icon library.
- FR-8: The system shall allow a user to add any skill (default or custom) to their profile, specifying whether their role for that skill is teacher or learner and providing a proficiency level.
- FR-9: The system shall allow a user to mark any of their skills as a favourite, causing it to appear at the top of the skill list on the home screen.

### Groups

- FR-10: The system shall allow a teacher to create a group associated with one of their teaching skills, specifying a name, description, difficulty level, visibility (public or private), maximum participant count, and a cover image.
- FR-11: The system shall allow a learner to browse and request to join public groups that are compatible with their proficiency level for that skill.
- FR-12: The system shall allow a teacher to approve or reject join requests from learners.
- FR-13: The system shall allow a teacher to invite friends who have the relevant skill as a learner and whose proficiency is compatible with the group difficulty.
- FR-14: The system shall allow a learner to leave a group. The group creator shall not be able to leave; they must delete the group instead.
- FR-15: The system shall allow a teacher to update group details or delete the group. Deletion shall cascade to all associated members, sessions, artifacts, and
  chat records.

### Sessions

- FR-16: The system shall allow a teacher to create a session within their group,specifying a title, description, session type, scheduled date, start time, end time, and optional file artifacts.
- FR-17: The system shall automatically enroll all current group members as session participants at the time of session creation, with an initial attendance status of absent.
- FR-18: The system shall allow a learner to check in to a session, changing their attendance status to present.
- FR-19: The system shall allow a teacher to mark a session as completed or cancelled. Cancellation shall trigger notifications to all participants.
- FR-20: The system shall allow artifacts to be added to an existing session after creation.

### Chat and Notifications

- FR-21: The system shall provide each group with a persistent chat room accessible to all members.
- FR-22: The system shall deliver new messages in real time to all connected members of the chat room via WebSocket.
- FR-23: The system shall allow any member to reply to a message with a quoted preview of the original.
- FR-24: The system shall allow the teacher to pin and unpin messages.
- FR-25: The system shall allow the teacher to create polls with between two and ten options, configurable for single or multiple-answer responses. Polls shall be visible as inline messages in the chat.
- FR-26: The system shall deliver in-app notifications for the following events: friend request sent, friend request accepted, group join request received, join request approved, group invitation received, session created, and session cancelled.

### AI Q&A

- FR-27: The system shall allow a learner (not a teacher) to ask questions in a persistent conversation within their group's Q&A panel.
- FR-28: The system shall retrieve the most semantically relevant passages from the group's session artifacts using vector similarity search and pass them to a large language model as grounded context.
- FR-29: The AI shall explicitly state when the requested information is not present in the course materials rather than generating an answer from general knowledge.
- FR-30: The system shall persist the conversation history per user per group, allowing the learner to review previous Q&A exchanges and clear the history if desired.

### Social Features

- FR-31: The system shall allow a user to search for other users by full name or nickname.
- FR-32: The system shall maintain a recent search history for each user, limited to the ten most recent searches.
- FR-33: The system shall allow a user to send, accept, and reject friend requests, subject to the target user's privacy settings.
- FR-34: The system shall display a public profile for each user showing their biography, skill portfolio (if not hidden), friend count, and mutual friends.

## 2.3 Non-Functional Requirements

**NFR-1 - Security.**
All passwords shall be stored as bcrypt hashes. All API routes (except registration, login, and password reset) shall require a valid JWT. File uploads shall be validated by MIME type and extension before storage. Supabase storage buckets shall enforce row-level security policies to prevent unauthorized access.

**NFR-2 - Performance.**
The AI Q&A pipeline shall use vector similarity search rather than full-text scan to retrieve relevant context, ensuring that response latency remains acceptable even as the number of uploaded artifacts grows. The embedding model (all-MiniLM-L6-v2) is loaded once at server startup and cached in memory for all subsequent requests.

**NFR-3 - Scalability.**
The separation of concerns between routes, controllers, services, and utilities in the backend architecture ensures that individual subsystems can be refactored or scaled independently. The use of Supabase as the database provider provides a managed PostgreSQL instance with connection pooling and storage bucket infrastructure.

**NFR-5 - Usability.**
The mobile application shall follow a consistent design system (defined color palette, typography scale, and spacing constants) across all screens. All forms shall provide inline validation with descriptive error messages. All asynchronous operations shall display loading indicators.

**NFR-6 - Maintainability.**
The frontend shall use TypeScript throughout, with typed navigation params, API response interfaces, and context values. The backend shall use a layered architecture (routes → controllers → services → utilities) with no business logic in controllers. All environment-specific configuration shall be externalized to `.env` files.

**NFR-7 - File Handling.**
The system shall accept file uploads of up to 10 MB per file for session artifacts and up to 5 MB for profile and cover images. Accepted artifact types shall include PDF, Word, Excel, PowerPoint, plain text, images, and CSV files.

## 2.4 Use Case Overview

The primary actors in the SkillSwap system are:

- **Unauthenticated User** - a visitor who has not yet logged in.
- **Authenticated User** - a registered user who has completed their profile.
- **Teacher** - an authenticated user acting in the teacher role within a specific group.
- **Learner** - an authenticated user acting in the learner role within a specific group.
- **System** - automated processes triggered by user actions (e.g., notification
  delivery, embedding generation).

The use case diagram below (Figure 2.1) captures the primary interactions between these actors and the system.

![Use Case diagram](UseCaseDiagram.png)
**Figure 2.1** — Use Case Diagram for SkillSwap

As illustrated in Figure 2.1, the system's use cases are organized around four primary actor categories. The unauthenticated user interacts only with the entry-point flows: registration, login, and password reset. Once authenticated and after profile completion, a user gains access to the social layer - skill management, user search, friend requests, and public profile viewing.

The teacher and learner roles are not account types but contextual roles: the same authenticated user may act as a teacher in one group while simultaneously acting as a learner in another. Within the teacher role, the user gains exclusive access to group creation, member management, session scheduling, artifact upload, message pinning, and poll creation. The learner role grants access to group discovery and joining, session check-in, poll voting, and the AI Q&A panel. Both roles share access to chat messaging and reply functionality.

Two system actors represent automated background processes. The first is the embedding generation process, which is triggered whenever a new artifact is uploaded and asynchronously processes the file into vector chunks stored in the database. The second is the real-time event delivery process, which represents the Socket.IO server that dispatches notifications and chat messages to connected clients.

## 2.5 Existing Solutions

A thorough review of existing platforms reveals that no current solution fully addresses the combination of requirements that define SkillSwap. The following analysis examines the most relevant prior work across four categories: tutoring marketplaces, video-based learning platforms, social learning tools, and AI-enhanced education tools.

### 2.5.1 Tutoring Marketplaces - Preply and Wyzant

Preply (preply.com) and Wyzant (wyzant.com) represent the dominant commercial model in the peer tutoring space. Both platforms connect learners with individual tutors, support session scheduling, and handle payments. Preply additionally provides an integrated video calling interface within its platform.

**Strengths:** High-quality tutor vetting, payment infrastructure, session recording on some plans, and a wide subject catalogue.

**Limitations:** Both platforms are inherently asymmetric - the tutor is always a paid professional, the learner always a paying customer. There is no mechanism for a user to occupy both roles simultaneously within the same platform. Groups and cohort-based learning are absent; every session is one-on-one. Neither platform integrates an AI assistant that operates on the specific materials a tutor has prepared. The commercial fee structure creates a friction barrier that excludes informal, community-based skill exchange.

### 2.5.2 Video-Based Learning - Skillshare and YouTube

Skillshare (skillshare.com) and YouTube represent the asynchronous video-based learning paradigm. Skillshare organizes content into structured courses with project-based assignments. YouTube provides open-access video content of enormous breadth.

**Strengths:** Massive content library, self-paced learning, global accessibility, and low barrier to content creation.

**Limitations:** Both platforms are fundamentally passive and asynchronous. There is no group formation, no session scheduling, no real-time communication between teacher and learner, and no mechanism to ask questions that are answered with reference to specific course materials. The learner-teacher relationship is one-directional: a user who teaches on Skillshare does not simultaneously appear as a learner within the same structural framework. AI features, where present, are generic content recommendations rather than grounded Q&A tied to specific uploaded materials.

### 2.5.3 Communication and Collaboration Tools - Discord and WhatsApp

Discord (discord.com) and WhatsApp are general-purpose communication platforms that are frequently repurposed for informal study groups. Discord in particular has gained traction as a community platform for online learning communities, supporting voice channels, text channels, and file sharing.

**Strengths:** Rich real-time communication, file sharing, community building, and broad device support.

**Limitations:** Neither platform is designed for structured learning. There is no concept of roles (teacher vs. learner), session scheduling, attendance tracking, proficiency-based group filtering, or AI assistance. Content organization is entirely manual and relies on community norms rather than system-enforced structure. The absence of a skill catalogue means that discovering relevant communities requires external search rather than in-platform browsing. Neither platform supports vector-based semantic search over uploaded documents.

### 2.5.4 AI-Enhanced Learning Tools - Khan Academy Khanmigo and Duolingo Max

Khan Academy's Khanmigo (khanmigo.ai) and Duolingo's Max tier represent the emerging category of AI-enhanced educational tools. Khanmigo is a conversational AI tutor built on GPT-4 that guides students through Khan Academy's existing content library. Duolingo Max uses GPT-4 for two features: Explain My Answer (contextual explanations of Duolingo exercises) and Roleplay (conversational practice scenarios).

**Strengths:** High-quality AI interaction, grounded (at least partially) in structured curricula, and integrated into established learning platforms with large user bases.

**Limitations:** Both tools are closed ecosystems - the AI answers questions about Khan Academy's or Duolingo's own content, not about materials uploaded by an individual teacher. Neither supports user-generated course content as the knowledge base for AI responses. Neither platform supports group formation, session management, or the reciprocal teacher-learner role model. The platforms are also subject-specific (mathematics and languages, respectively) rather than open to any skill domain.

### 2.5.5 Summary and the Gap SkillSwap Fills

The following table summarizes the feature coverage across existing solutions and
SkillSwap.

**Table 2.1** — Feature Comparison Across Existing Solutions and SkillSwap

| Feature                             | Preply/Wyzant | Skillshare/YouTube | Discord/WhatsApp | Khanmigo/Duolingo Max | SkillSwap |
| ----------------------------------- | :-----------: | :----------------: | :--------------: | :-------------------: | :-------: |
| Reciprocal teacher-learner roles    |       ✗       |         ✗          |        ✗         |           ✗           |     ✓     |
| Group-based learning with approval  |       ✗       |         ✗          |        ✗         |           ✗           |     ✓     |
| Session scheduling and attendance   |       ✓       |         ✗          |        ✗         |           ✗           |     ✓     |
| File artifact upload per session    |       ✗       |         ✗          |        ✓         |           ✗           |     ✓     |
| Real-time group chat                |       ✗       |         ✗          |        ✓         |           ✗           |     ✓     |
| In-chat polls                       |       ✗       |         ✗          |        ✓         |           ✗           |     ✓     |
| AI Q&A grounded in uploaded content |       ✗       |         ✗          |        ✗         |        Partial        |     ✓     |
| Proficiency-based group filtering   |       ✗       |         ✗          |        ✗         |           ✗           |     ✓     |
| Social graph (friends, search)      |       ✗       |         ✗          |        ✓         |           ✗           |     ✓     |
| Mobile-first application            |       ✓       |         ✓          |        ✓         |           ✓           |     ✓     |
| Open skill domain (any subject)     |       ✓       |         ✓          |        ✓         |           ✗           |     ✓     |

As Table 2.1 demonstrates, SkillSwap is the only platform in this comparison that simultaneously provides reciprocal role assignment, group lifecycle management,real-time chat with polls, structured session and artifact management, and an AI Q&A system grounded in teacher-uploaded course materials.

The gap that SkillSwap fills is precise: it is the missing infrastructure layer between informal communication tools (Discord, WhatsApp) and formal paid tutoring platforms (Preply, Wyzant), enriched with the kind of AI assistance that existing EdTech tools provide only within their own closed content libraries. SkillSwap brings AI grounding to user-generated, teacher-defined course content - a capability that does not exist in any of the surveyed solutions.

This gap defines the technical scope of the project and motivates every architectural decision documented in the chapters that follow.
