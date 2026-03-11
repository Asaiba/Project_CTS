--
-- PostgreSQL database dump
--

\restrict T8R4gqACeVhNTbdMertpJfwdARLbDaZwmCu49uMerAn3m6wpWWUOeyuP7Iw1VV8

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicationStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."ApplicationStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'student',
    'college',
    'dao',
    'admin'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: VoteChoice; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."VoteChoice" AS ENUM (
    'yes',
    'no'
);


ALTER TYPE public."VoteChoice" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid NOT NULL,
    actor_user_id uuid,
    action text NOT NULL,
    target_user_id uuid,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: college_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.college_applications (
    id uuid NOT NULL,
    student_id uuid NOT NULL,
    college_id uuid NOT NULL,
    status public."ApplicationStatus" DEFAULT 'pending'::public."ApplicationStatus" NOT NULL,
    message text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.college_applications OWNER TO postgres;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: proposal_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposal_votes (
    id uuid NOT NULL,
    proposal_id uuid NOT NULL,
    voter_id uuid NOT NULL,
    choice public."VoteChoice" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.proposal_votes OWNER TO postgres;

--
-- Name: proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposals (
    id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    college_id uuid NOT NULL,
    deadline_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.proposals OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    revoked_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text,
    role public."Role" DEFAULT 'student'::public."Role" NOT NULL,
    wallet_address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    logo_url text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
f2560eb1-3912-4cb7-8005-8ce59b6bfb7b	74f928b90e431f70a9d2a414563561ef27184cfa13bd1c97bbf06a9d439891af	2026-02-27 08:42:00.536607+00	0001_init	\N	\N	2026-02-27 08:42:00.448286+00	1
b95bfb9e-e706-41e1-8773-fc2530d36433	395268608d188bb46001df8f8507c65f7367458884900b462088a7d2363a9f92	2026-03-02 15:26:56.186467+00	0002_user_logo_url	\N	\N	2026-03-02 15:26:56.15744+00	1
c043bbc5-5f98-4928-b58b-787c1c7e71d7	0d726b6e63ee750f3b98a22f1a913af3956c7bd8103880b5def4aad5f7a81a3c	2026-03-02 21:19:52.680866+00	0003_proposals	\N	\N	2026-03-02 21:19:52.602124+00	1
f3a07c42-8b7f-4c4b-a7b8-ae00062ddca1	1c2874fd63d7634f2e4531df53327c04a1d9dac027b464d0190afd36ae596284	2026-03-03 10:10:28.562711+00	0004_college_applications	\N	\N	2026-03-03 10:10:28.499788+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, actor_user_id, action, target_user_id, metadata, created_at) FROM stdin;
78319581-9de7-4db2-a270-27358b4bafbf	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	3ea29fb3-cae9-4faf-bfc1-9cfb2e324707	{"role": "college"}	2026-03-02 13:50:33.722
1c4154c5-0ca2-426c-ad5c-ee5499f53a34	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.deactivated	3ea29fb3-cae9-4faf-bfc1-9cfb2e324707	{}	2026-03-02 13:50:33.765
9de6fe63-3de9-45f9-8aee-fef7250b977b	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "http://localhost:4000/uploads/1772462362168-740449466.png"}	2026-03-02 14:39:26.461
7ab0361d-9213-4808-a254-d4313baf4a83	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	\N	{"role": "dao"}	2026-03-02 14:41:16.221
3839d63f-92ea-46e8-8c95-8545a6b375cb	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.deactivated	\N	{}	2026-03-02 15:17:25.732
e57b6cd5-57c9-43a1-981c-dc00fc6ae71b	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	\N	{"role": "dao"}	2026-03-02 15:17:33.24
54a1e877-325b-4a2f-a63d-b3999be651cd	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.deactivated	\N	{}	2026-03-02 15:17:38.971
f6fa83c5-1b46-4aa7-8667-2db4d61a44b1	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "http://localhost:4000/uploads/1772466302685-906254174.png"}	2026-03-02 15:45:05.352
d9a37565-c53d-409a-af1f-3ade7917d5ac	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "http://localhost:4000/uploads/1772467698037-290009387.png"}	2026-03-02 16:09:24.745
0179db18-8036-44b3-9c58-a10111232368	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	\N	{"role": "dao"}	2026-03-02 16:15:32.387
65d19844-8554-4fa7-8350-86bd5aa7b768	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	\N	{"role": "college"}	2026-03-02 16:24:04.546
dfef75ec-54c5-4d0f-9e37-6043fe463513	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "http://localhost:4000/uploads/1772469187709-107987989.png"}	2026-03-02 16:33:09.901
b7fd0924-78e0-41e9-ba23-c14c8733cc9e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "http://localhost:4000/uploads/1772469845498-438915529.png"}	2026-03-02 16:44:08.507
d26cd15d-dc56-468c-9114-332c5416c7e8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772471712295-575933855.png", "username": "SAIBA'S University of Arts"}	2026-03-02 17:15:14.657
a3f1b737-7a7a-4886-bfcb-3b21edecbec2	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772471729018-365967563.png", "username": "SAIBA'S University of Arts"}	2026-03-02 17:15:37.109
e138281d-3675-49bb-9e86-334f471ec74f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772481885782-128129474.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:04:47.798
98a7c79f-74b4-4cc2-8baf-22086c8de689	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772467241497-402510939.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:07:04.828
08eb3d69-e491-4333-af66-38ef5270bfea	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772482113989-291325357.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:08:34.018
1160ee3d-e5e8-4a0b-8fef-f188e74ef9e4	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772482140951-348587609.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:09:00.988
1d0337a5-e931-41a8-b422-3f641abcbfda	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "http://localhost:4000/uploads/1772482284071-12728872.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:11:24.108
4173c5a3-179f-423b-bd13-a6d808f75a26	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772482887637-507248650.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:21:27.671
22b6cbe1-c944-4f83-a696-1f4bd85f1c4d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772483075056-976260140.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:24:35.079
e453e368-ae9a-47ff-b7c1-0d978439fab9	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772483573595-946049800.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:32:53.614
c59bf8be-4a00-4daa-90d2-ebb952cc344f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "/uploads/1772484532414-733404279.png"}	2026-03-02 20:48:55.751
d11e57f7-e0ca-4e7f-968d-0a3526b5fc77	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772484788427-258818828.png", "username": "SAIBA'S University of Arts"}	2026-03-02 20:53:08.457
2b2c5a77-7d4f-492b-bf3a-f18c1d729b30	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	\N	{"role": "dao"}	2026-03-02 21:06:18.989
44c22df6-49b1-490b-a742-1bd27ae02118	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772484788427-258818828.png", "username": "SAIBA'S University of Arts"}	2026-03-03 09:44:27.32
5e81c74b-6321-4198-b297-d808a74bc67a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	8a0c6813-d988-4e81-b37a-4b5bbe4b5064	{"role": "college", "logoUrl": null}	2026-03-04 17:20:49.814
a9f8d706-5260-4ba5-a506-7abb906c47f8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	ad1d0302-5f17-44ce-a381-093108035ff9	{"role": "dao", "logoUrl": null}	2026-03-04 17:20:50.176
a51c0141-0ad9-4cf6-b07b-86be7d3615d8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	\N	{"role": "college", "logoUrl": "/uploads/1772635603292-963192620.png"}	2026-03-04 14:46:45.555
7270578a-bf0c-405a-a353-4d88c0c1d51a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	\N	{"role": "college", "email": "saibaaubin@gmail.com", "logoUrl": "/uploads/1772635603292-963192620.png", "username": "SUA", "walletAddress": "0xC63582cf307902335CB3Bc4EdB9bD0127d806487"}	2026-03-04 15:16:33.139
44721473-22a0-4b2e-9663-deaf856b9acc	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.created	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "college", "logoUrl": null}	2026-03-04 19:40:38.27
8c04c68f-6a14-47a9-9352-0c794094dd9a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.role.updated	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "dao"}	2026-03-04 20:25:55.435
48c1434c-2eac-4e4a-81f9-0680b9eecebf	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	ad1d0302-5f17-44ce-a381-093108035ff9	{"role": "college", "email": "smoke.dao.1772652049@cts.local", "username": "Smoke DAO", "walletAddress": "0x2222222222222222222222222222222222222222"}	2026-03-04 20:54:01.654
680dac0e-66d5-4a20-8855-9bc80274df3a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	ad1d0302-5f17-44ce-a381-093108035ff9	{"role": "dao", "email": "smoke.dao.1772652049@cts.local", "username": "Smoke DAO", "walletAddress": "0x2222222222222222222222222222222222222222"}	2026-03-04 20:54:13.714
3c386abe-23f1-4188-aac6-077123a6216d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	ad1d0302-5f17-44ce-a381-093108035ff9	{"role": "dao", "email": "smoke.dao.1772652049@cts.local", "username": "Smoke DAO", "walletAddress": "0x2222222222222222222222222222222222222222"}	2026-03-04 20:54:16.246
737c3dce-afc5-4af2-bcb0-adb95b452fb8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "college", "email": "saibaaubin@gmail.com", "username": "SUA", "walletAddress": "0xc63582cf307902335cb3bc4edb9bd0127d806487"}	2026-03-04 20:54:32.793
60439296-03fa-4874-a084-2b80e7c2c7c6	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "dao", "email": "saibaaubin@gmail.com", "username": "SUA", "walletAddress": "0xc63582cf307902335cb3bc4edb9bd0127d806487"}	2026-03-04 21:04:35.468
f6a39c71-e5e1-4b5c-9941-f26686b06336	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "college", "email": "saibaaubin@gmail.com", "username": "SUA", "walletAddress": "0xc63582cf307902335cb3bc4edb9bd0127d806487"}	2026-03-04 21:36:19.565
b1104d46-b4e6-4d0b-a336-c68a7d8196b6	fbe722a3-c870-4f78-b463-ed5a7cffbba8	user.updated	94b2dc4f-f7ef-4e34-9c15-192983fc7439	{"role": "dao", "email": "saibaaubin@gmail.com", "username": "SUA", "walletAddress": "0xc63582cf307902335cb3bc4edb9bd0127d806487"}	2026-03-04 21:43:03.901
\.


--
-- Data for Name: college_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.college_applications (id, student_id, college_id, status, message, created_at, updated_at) FROM stdin;
5b89f4c8-01ba-4ee7-ad58-17429f6374c3	32445aeb-3f16-4e60-9bf2-d935bb4c197c	8a0c6813-d988-4e81-b37a-4b5bbe4b5064	approved	CTS_APP_V1:{"title":"Smoke Funding","description":"Smoke test description for application flow.","message":"Smoke Funding"}	2026-03-04 17:20:50.895	2026-03-04 17:20:51.365
80d39597-b6ef-411e-a030-e2393fbdfac6	170de289-54b4-460f-867a-ea7adb3784ce	94b2dc4f-f7ef-4e34-9c15-192983fc7439	approved	CTS_APP_V1:{"title":"JJk","description":"Saturo gojo's resque","message":"JJk"}	2026-03-04 20:23:51.944	2026-03-04 20:24:17.003
d5712805-af18-482b-b47c-bd5ec93facf2	170de289-54b4-460f-867a-ea7adb3784ce	94b2dc4f-f7ef-4e34-9c15-192983fc7439	rejected	CTS_APP_V1:{"title":"Deny","description":"Testing the denial","message":"Deny"}	2026-03-04 21:01:42.834	2026-03-04 21:02:28.585
b62b37fb-ad86-456b-b2b3-168ea6e42007	170de289-54b4-460f-867a-ea7adb3784ce	94b2dc4f-f7ef-4e34-9c15-192983fc7439	approved	CTS_APP_V1:{"title":"Sepolia","description":"Wanna test if it's working","message":"Sepolia"}	2026-03-04 21:01:09.648	2026-03-04 21:02:31.398
e967c3b8-c572-46b4-9921-8e48e01e3c75	170de289-54b4-460f-867a-ea7adb3784ce	94b2dc4f-f7ef-4e34-9c15-192983fc7439	approved	CTS_APP_V1:{"title":"Iot building","description":"Build robots to work in a warehouse","message":"Iot building"}	2026-03-04 21:41:14.438	2026-03-04 21:41:43.812
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: proposal_votes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proposal_votes (id, proposal_id, voter_id, choice, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proposals (id, title, description, college_id, deadline_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, created_at) FROM stdin;
2363dfc4-d911-4131-ad7b-1de061fb09fb	fbe722a3-c870-4f78-b463-ed5a7cffbba8	d3f3f8f9d36efb492625fb16679b8e4c56b82544cd93df1418d339439183a419	2026-03-06 08:52:04.112	\N	2026-02-27 08:52:04.114
01a374f4-19c6-452c-a6e4-773d5b6e72eb	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4067c5c3ce6f7cd20e6c86f5f81f0462d5b4ef5d054e9b1bf8b6514825d8ccf7	2026-03-06 10:27:54.578	\N	2026-02-27 10:27:54.581
df385891-6b38-4ff6-8ecd-ec79be4b0cab	fbe722a3-c870-4f78-b463-ed5a7cffbba8	984850946180911011a2159a828d44dce079e90335d335c499c30d2a53c25569	2026-03-09 12:11:55.832	\N	2026-03-02 12:11:55.833
a3ef6c90-b6bc-463e-a9ba-b1900c467a0f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	8ba0dfa14a7c63a916f1e0883e87e175e835b00713262414f52a1bed7c0295d3	2026-03-09 12:21:20.072	\N	2026-03-02 12:21:20.073
2521cb47-da4c-4441-80aa-771a35cf1649	fbe722a3-c870-4f78-b463-ed5a7cffbba8	fe1a91fc11e20a91c5e2a9f95554a8ae7db97b5d874794b0a874dc70cc0a2bdb	2026-03-09 13:50:21.598	\N	2026-03-02 13:50:21.6
1dd1da6d-6af5-442f-89e7-cd3e01f15ef8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	9ed1e54a3d442401385fcd232b1d571ddfcce6ff61e212a79571e451793f78b9	2026-03-09 13:50:33.409	\N	2026-03-02 13:50:33.41
23b6e00f-26a3-42a1-878c-fe084bddb88f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	2fad509df8b2663eccb61d53b3940dd201166ed32ee54ed8470b13a1874c9f62	2026-03-09 14:33:54.128	\N	2026-03-02 14:33:54.13
e583b2b4-1a7f-4965-9dbb-06d83af58699	fbe722a3-c870-4f78-b463-ed5a7cffbba8	898f360738270e6ac11946c52f9285524634823e39baf40ed5bbb9fbedbf4807	2026-03-09 14:36:26.67	\N	2026-03-02 14:36:26.671
d727f2a5-55c5-42a2-a3e6-063ccfeb3fc3	fbe722a3-c870-4f78-b463-ed5a7cffbba8	86c0b12b940a6768a3d327f1089c5ff1725a6f85f7cd1847a781c39396dfb3a8	2026-03-09 14:36:42.645	\N	2026-03-02 14:36:42.646
26eeb925-357d-4577-8f60-03bf38050f06	fbe722a3-c870-4f78-b463-ed5a7cffbba8	2f5338d58ab4d861ab0d9c7f2d1b18cfdec84a1effc3be81f56fc3769f8f3a86	2026-03-09 14:37:45.399	\N	2026-03-02 14:37:45.401
f8abd36e-fe6a-4af1-b202-42a06d2f1b64	fbe722a3-c870-4f78-b463-ed5a7cffbba8	b999f3a910766e04c80f777e7cb6c3b25bddf1ed49f96ac314aad8a0e0e50dda	2026-03-09 14:37:55.713	\N	2026-03-02 14:37:55.715
5743fa37-6018-4de0-8b52-7ea3fbfb0a36	fbe722a3-c870-4f78-b463-ed5a7cffbba8	ffea55efd165280e51e1287b07e534869586efe488d6a9c7493c6f9198f004b2	2026-03-09 14:38:47.492	\N	2026-03-02 14:38:47.494
c1f8baa2-9912-4ca4-b9fd-ee6b23c5bbc2	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.851	\N	2026-03-02 19:39:57.853
1314fce1-4544-46e6-b24b-1631a54eef1b	fbe722a3-c870-4f78-b463-ed5a7cffbba8	ed74d62403b287fdc10107de5f781dbb3a63b561d21e2148867a9e85b12a9d11	2026-03-09 16:49:11.214	2026-03-02 17:10:54.728	2026-03-02 16:49:11.216
8c46d7ff-da11-4be7-a5d3-91a945e48d33	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cc44f548a685f1b96920e35fe557848652fb7b0cbd2e868f6a7ad9c3c3401730	2026-03-09 17:10:54.738	\N	2026-03-02 17:10:54.741
2c4b965b-1314-4385-9908-7de40842b9eb	fbe722a3-c870-4f78-b463-ed5a7cffbba8	f52e6fd2d3c4a89f0a5ff80824a7ce893120a486eda40406e8360d955db4ac15	2026-03-09 15:15:07.029	2026-03-02 15:43:43.316	2026-03-02 15:15:07.031
9087f76d-daaa-42d0-ba31-e1fc1825e0e7	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cb2371cd9eaf53f85acee4f4f9b697ea55d932d1ffb72c07d464a04bcbbf34ba	2026-03-09 15:43:43.316	\N	2026-03-02 15:43:43.317
ba991494-72e7-45f9-938d-6b5720f5a19c	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cb2371cd9eaf53f85acee4f4f9b697ea55d932d1ffb72c07d464a04bcbbf34ba	2026-03-09 15:43:43.319	\N	2026-03-02 15:43:43.32
85be3173-1967-4945-8f62-280db1caac9a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cb2371cd9eaf53f85acee4f4f9b697ea55d932d1ffb72c07d464a04bcbbf34ba	2026-03-09 15:43:43.323	\N	2026-03-02 15:43:43.324
e39ceca4-4267-4d31-ac4d-a51adda3f552	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cb2371cd9eaf53f85acee4f4f9b697ea55d932d1ffb72c07d464a04bcbbf34ba	2026-03-09 15:43:43.328	\N	2026-03-02 15:43:43.329
c88a295d-07b0-4556-9f4e-ef26667c3c27	fbe722a3-c870-4f78-b463-ed5a7cffbba8	c5d800a015dc63316f3c080e152281a5ad3115769963b864a234dfabe62a9956	2026-03-09 15:44:47.065	\N	2026-03-02 15:44:47.066
f42bcb3d-21fa-4a00-a830-6cf0bdc0ad3a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	21a98e641185b345a0f3677561f5986257af061167fe2a65522aecc7fd2740c5	2026-03-09 15:58:08.776	\N	2026-03-02 15:58:08.778
e3f59c33-8318-49d7-a11b-195ae593445f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	5ff14a871f63d17f9b00dcb63167dc55e4aa9e5c217e4ae88213f4bfd664b71d	2026-03-09 16:00:41.403	\N	2026-03-02 16:00:41.405
2a446dab-455d-4a5d-8544-16a6a6cc1246	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cc44f548a685f1b96920e35fe557848652fb7b0cbd2e868f6a7ad9c3c3401730	2026-03-09 17:10:54.756	\N	2026-03-02 17:10:54.758
e43f91f1-bb9b-4e45-94da-d16c184cad0e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	035ade4eb43bd7041fc7b287acfdbda2988a62765ea7aec8134437a28c47a438	2026-03-09 16:32:04.749	\N	2026-03-02 16:32:04.75
eb6107f9-7676-4505-ac4a-506d9d5bda6c	fbe722a3-c870-4f78-b463-ed5a7cffbba8	8c80508eab7399798be581d07a45df8ba33b908929a4e1ed3bb27beffb64b4e8	2026-03-09 16:15:21.284	2026-03-02 16:32:04.754	2026-03-02 16:15:21.285
6034f78a-e8d9-4818-bc7d-037609545753	fbe722a3-c870-4f78-b463-ed5a7cffbba8	035ade4eb43bd7041fc7b287acfdbda2988a62765ea7aec8134437a28c47a438	2026-03-09 16:32:04.766	\N	2026-03-02 16:32:04.767
611ef249-d90d-40a9-92bb-306a4f77487b	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cc44f548a685f1b96920e35fe557848652fb7b0cbd2e868f6a7ad9c3c3401730	2026-03-09 17:10:54.76	\N	2026-03-02 17:10:54.762
4156dfb9-64e4-4f14-950a-f8ac2591c30e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.528	\N	2026-03-02 16:48:40.53
7481846a-36d4-4065-a246-976f853ebd38	fbe722a3-c870-4f78-b463-ed5a7cffbba8	2d9ad759bf8059e641495c020180ffc016065c0d19a69ef4017e5e0ebd35c2f9	2026-03-09 20:06:48.191	\N	2026-03-02 20:06:48.192
95107778-9ca2-49d8-91ba-b77db4aeb642	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.532	\N	2026-03-02 16:48:40.534
ed24e0e5-51de-481c-a4a8-c6b7f8b00883	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.539	\N	2026-03-02 16:48:40.542
8acca0f7-8b1e-401b-beef-1147fc1182d8	fbe722a3-c870-4f78-b463-ed5a7cffbba8	7192c7c8bc5845452ccb463d536b5de446102bf398fb426e1901fe6e492acc70	2026-03-09 19:40:23.919	2026-03-02 20:03:56.198	2026-03-02 19:40:23.92
a30926bf-1222-4c7f-8e00-493c75de5e1e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	23423d20faffead833a72d05a628c55f5131b938fd7c70669d2678271e901f1f	2026-03-09 16:32:22.77	2026-03-02 16:48:40.529	2026-03-02 16:32:22.771
e9773695-aecd-4920-b6c7-0b0d27b19dd3	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.554	\N	2026-03-02 16:48:40.556
19e18654-bdb1-4aa9-9e49-91e7093e8c0a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.568	\N	2026-03-02 16:48:40.571
afc2f1e5-c5c5-4402-83b7-df0a52c83d1f	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afdc7d3bf6cd54e4882f1e94c58cd94f2648ce1d308cee219fb5b521c0ab3eb2	2026-03-09 16:48:40.574	\N	2026-03-02 16:48:40.577
e18e967c-78ec-4e5c-b49e-2213ad5a6ddd	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.856	\N	2026-03-02 19:39:57.858
ffaf2824-3851-4eac-accc-e196d4fde025	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cc44f548a685f1b96920e35fe557848652fb7b0cbd2e868f6a7ad9c3c3401730	2026-03-09 17:10:54.722	\N	2026-03-02 17:10:54.724
5c5f7e9a-6e00-473c-838a-ea8987e04390	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.833	\N	2026-03-02 19:39:57.835
23833573-0115-43a9-b19c-dd5772eb7e62	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0aa4f34425c451a92362fe0b3276268cd514cdbf53570d08cfe14e3ff70cfffc	2026-03-09 20:03:56.207	\N	2026-03-02 20:03:56.208
f92802c7-756e-47de-87a2-456f0119263e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.837	\N	2026-03-02 19:39:57.838
d205f4b8-35a0-48a9-bb5e-ac7a4dfe8e75	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.841	\N	2026-03-02 19:39:57.842
c48c74b0-9712-4748-9ee5-2b45428518c5	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0aa4f34425c451a92362fe0b3276268cd514cdbf53570d08cfe14e3ff70cfffc	2026-03-09 20:03:56.212	\N	2026-03-02 20:03:56.213
57f34e97-22b9-4ec8-b39c-a6037c30cb67	fbe722a3-c870-4f78-b463-ed5a7cffbba8	12126b67a3109c763448a069f28f54b995d1386c60ff0ec832b8c6096210dd49	2026-03-09 19:39:57.844	\N	2026-03-02 19:39:57.846
2b9181d7-41f3-4172-a1c6-cae72479e4b7	fbe722a3-c870-4f78-b463-ed5a7cffbba8	ee9c2089139135e1ce893b176ed4ceec67386647cf81cbf2c834715954c17ae7	2026-03-09 17:14:52.547	2026-03-02 19:39:57.828	2026-03-02 17:14:52.548
77fbe65b-5931-48b6-917b-08f3adb51500	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0aa4f34425c451a92362fe0b3276268cd514cdbf53570d08cfe14e3ff70cfffc	2026-03-09 20:03:56.216	\N	2026-03-02 20:03:56.217
e76bb3d4-4cf7-4fe3-a4e4-90eab79de474	fbe722a3-c870-4f78-b463-ed5a7cffbba8	e45c065ce08c15656458b52a7a4153782fc636d791e5ae1d69daee9020801e6f	2026-03-09 20:07:04.803	\N	2026-03-02 20:07:04.804
0fa271ef-1ce1-4542-ab81-2d7e9f5493ab	fbe722a3-c870-4f78-b463-ed5a7cffbba8	a137b7afc9a549a696e2dadc6f8eb9fc476ad042b27cc8a0c564f46f3c623bc8	2026-03-09 20:19:36.832	\N	2026-03-02 20:19:36.834
6a6272be-8e97-4370-96f7-8d49a959a810	fbe722a3-c870-4f78-b463-ed5a7cffbba8	f2f2232e5d58ec7913750321fe9584fa9244cac1b9676249ee050051513d18f7	2026-03-09 20:04:12.168	2026-03-02 20:19:36.834	2026-03-02 20:04:12.169
b33caeb3-442e-4f97-b489-473bf8531fbd	fbe722a3-c870-4f78-b463-ed5a7cffbba8	a137b7afc9a549a696e2dadc6f8eb9fc476ad042b27cc8a0c564f46f3c623bc8	2026-03-09 20:19:36.846	\N	2026-03-02 20:19:36.848
d80e8c70-a716-4c5d-89aa-8e292b7298a2	fbe722a3-c870-4f78-b463-ed5a7cffbba8	848d9034908a705b9430015cbc6c16a25c0129d623a64a5d0762b9b6a337aabe	2026-03-09 20:19:45.541	\N	2026-03-02 20:19:45.543
edbb49aa-7626-4b86-b33a-2369db912571	fbe722a3-c870-4f78-b463-ed5a7cffbba8	43ef1396871c0b56ee23b2b517a0458963b46c0e5b4a95f91ef23e59f2a88f64	2026-03-09 20:32:19.3	\N	2026-03-02 20:32:19.301
b7989bd9-0f0c-4249-974e-f69c8c03fd0a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	af126acd4d946b76b6bfe3d031453a823b2c17c721a70a47cc42ffbf1f66875a	2026-03-09 20:37:37.669	2026-03-02 20:53:08.398	2026-03-02 20:37:37.67
a0428101-bb39-47a5-a537-079d8814c360	fbe722a3-c870-4f78-b463-ed5a7cffbba8	b9dd097660101acb3482be32cbb0f12cda6fec9db31df9df1179cba026a1f633	2026-03-09 20:53:08.41	\N	2026-03-02 20:53:08.411
cce4435a-5069-4cad-8b58-31090bd74bf6	fbe722a3-c870-4f78-b463-ed5a7cffbba8	debb55015468855bd61170f25808ddb669b2995405c45a1b3b664e22de5f3b79	2026-03-11 14:45:45.155	\N	2026-03-04 14:45:45.157
451fea07-77ab-403d-a79e-0c14b446d905	fbe722a3-c870-4f78-b463-ed5a7cffbba8	30f32d9ca138160abd5ff1fb7824ec701ee295e18b519079fa871d615c41c0d0	2026-03-09 21:23:37.851	\N	2026-03-02 21:23:37.852
dff18df0-0bad-4c20-8113-9d58424cff9b	fbe722a3-c870-4f78-b463-ed5a7cffbba8	2670a5cf396f52cae912990a4b7058b44a5a6265fe9f512f3085ef5a437169bb	2026-03-11 15:13:23.447	\N	2026-03-04 15:13:23.448
472d287b-5aa1-4a2c-bb15-a1c0d780eff4	fbe722a3-c870-4f78-b463-ed5a7cffbba8	7ee9adabdd24b8859c55543ca41b1556e0b33c33fe7f1dcf99a1cb37a0b12484	2026-03-10 09:38:44.845	\N	2026-03-03 09:38:44.846
613e2617-9931-478c-8a51-d94e4f1f6911	fbe722a3-c870-4f78-b463-ed5a7cffbba8	afa393e888031ca89cc1e3bc8270da78ae5ab61be96d19931fee6f7ffd1100fd	2026-03-10 09:42:40.253	\N	2026-03-03 09:42:40.255
c8d48dcb-a192-49ad-aefe-6a324fda5097	fbe722a3-c870-4f78-b463-ed5a7cffbba8	57f32262c6ee373be71e7272cf452963c921679c959b765aaef778f348be7a99	2026-03-10 09:44:18.402	\N	2026-03-03 09:44:18.403
48b1af78-2f73-4ddf-a286-2b4a7de67fff	fbe722a3-c870-4f78-b463-ed5a7cffbba8	73e2acbd211f710294580a1a8c6ef537b3c152232f39dc24aac105a2ebdc795b	2026-03-11 17:21:26.56	\N	2026-03-04 17:21:26.561
816e694c-7d87-4ff6-97ba-5182e2473f7a	fbe722a3-c870-4f78-b463-ed5a7cffbba8	3e4c9046a039b4657b15b5f89a261bf0b026eb94dc1ef65717a4240578566d12	2026-03-11 17:21:51.394	\N	2026-03-04 17:21:51.396
bd4e68c0-6fc6-44a7-8013-ec11a80a5d9c	fbe722a3-c870-4f78-b463-ed5a7cffbba8	fe689ad4d194d5859f2d2dbb2b0a9e5169a09a8131fae1751c05ddea8778bc26	2026-03-11 17:22:11.109	\N	2026-03-04 17:22:11.111
07844a41-6d48-4913-b349-788c2c4a7f5e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.682	\N	2026-03-04 19:46:44.683
52763282-35bb-4fd1-b6f7-905c04ed1a90	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.69	\N	2026-03-04 19:46:44.691
1e4ca3fc-281b-45dd-99db-f07b8a0c04a1	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.698	\N	2026-03-04 19:46:44.699
f031e1dd-6dd1-4532-a7fc-b1748b79fe67	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.709	\N	2026-03-04 19:46:44.71
53c56eba-78da-4008-b8ee-b21334b54085	fbe722a3-c870-4f78-b463-ed5a7cffbba8	e8a956e92abe1b688c9e1fb28ff9cf2364f0af2e36ff4aed23b39fc299c3772f	2026-03-11 19:47:04.27	\N	2026-03-04 19:47:04.271
a6eb7fc8-8c53-4c60-aca4-810a1fd6fde4	94b2dc4f-f7ef-4e34-9c15-192983fc7439	2a373384daae771dc206695618f0e01c7b5c429b431cdc1e7dae700597a39452	2026-03-11 19:50:25.168	\N	2026-03-04 19:50:25.17
c304c926-e9c7-495a-a207-c4b2a6e5a796	94b2dc4f-f7ef-4e34-9c15-192983fc7439	cf14fd5e376aadd7f8109745c16f70d1c1b778428d1f473953a0dead3f3d5f8f	2026-03-11 19:56:55.64	\N	2026-03-04 19:56:55.641
a4aac2b0-d624-46a5-8291-4e8a47d3b63e	fbe722a3-c870-4f78-b463-ed5a7cffbba8	f78fd4caf8639034dcbc9e511d54ec3d19ac35da30db5183f3ae4ac20790bd91	2026-03-11 20:25:37.464	\N	2026-03-04 20:25:37.465
2d17dbc1-84b3-4103-88b0-831a6568464b	1e65fcfa-2dd2-42e3-9052-3ed57e782dab	dc03cf06cb5a8163508d8f5f176bb8235a1f994e57bc9ed3655d294b88addaa1	2026-03-10 12:47:41.822	\N	2026-03-03 12:47:41.823
60921181-6762-487f-9787-9f22564ab4e8	170de289-54b4-460f-867a-ea7adb3784ce	a52bd7dc784151b9bc608513b92ad8b2f4ea6551ce827304022097be129ee706	2026-03-11 20:29:32.144	\N	2026-03-04 20:29:32.145
ddfd4716-2d70-40e3-8a9d-055f18bd9c6c	fbe722a3-c870-4f78-b463-ed5a7cffbba8	936759a7fa1143936f56a11ddee43d485a8074037769226a7891cc89059e8a06	2026-03-11 20:53:45.855	\N	2026-03-04 20:53:45.856
02f494c1-6e40-4f86-b0d1-e26aaa3044a9	94b2dc4f-f7ef-4e34-9c15-192983fc7439	1fd507d8cc6068f039086549ad273c918c10edd04a20e99d563864a18e3beab9	2026-03-11 21:02:13.046	\N	2026-03-04 21:02:13.048
63780360-db2a-4bed-94be-7affa41e44cf	94b2dc4f-f7ef-4e34-9c15-192983fc7439	1e0a5b64deb3592d42fd049fde4a290f9098fc894c52d8f0c542e3e24f1e760e	2026-03-11 21:04:57.227	\N	2026-03-04 21:04:57.228
fb7fde9a-0f13-43d9-9f18-abe58814203c	94b2dc4f-f7ef-4e34-9c15-192983fc7439	defdd4c2531911d816825810b29fb68cb03bd359a6218ebe043dcd4b5b819855	2026-03-11 21:07:41.857	\N	2026-03-04 21:07:41.858
5ba2fda7-6b20-4e7d-ba12-37bf5b65d100	fbe722a3-c870-4f78-b463-ed5a7cffbba8	a253219b1302d897e2e42aabb4cbcec6a967e7b998bd463da085e4707831c7e6	2026-03-11 21:38:49.085	\N	2026-03-04 21:38:49.086
7e720388-cd84-422f-a95b-e46ab64f56cc	94b2dc4f-f7ef-4e34-9c15-192983fc7439	16e94e3a8c576738c0da329c31adde978a18b7eb2b8a62d45d16075855cbebbb	2026-03-11 21:41:31.686	\N	2026-03-04 21:41:31.688
b65132bf-8de9-4446-adc3-7cfca1e482d6	94b2dc4f-f7ef-4e34-9c15-192983fc7439	712ef231ddfef5773f425db75e926b0c513547138ed777e50a092b8c4229f75f	2026-03-11 21:43:17.965	\N	2026-03-04 21:43:17.967
8e831764-f595-49e2-998a-55350b3c84b9	170de289-54b4-460f-867a-ea7adb3784ce	9ea515931f0cdab818b6e989d5404c2bcbe304f4d3b1434374948b72c9a9ce21	2026-03-18 08:55:32.094	\N	2026-03-11 08:55:32.096
734f3ee3-4428-47a8-8e2e-64f61c22ae15	94b2dc4f-f7ef-4e34-9c15-192983fc7439	fd0d7116da95e4fd8ac87331c75051daf6d8ae7a09b39b1c852a907cc1f73446	2026-03-18 09:00:05.577	\N	2026-03-11 09:00:05.578
04493759-c5bc-4f52-8f6e-9d21b8054cb3	fbe722a3-c870-4f78-b463-ed5a7cffbba8	b6ceff5c2ae1a861d4a5cf24f21df5a2d01325a2881c374f06fb284082c42c25	2026-03-18 09:00:47.124	\N	2026-03-11 09:00:47.126
694de2d3-1140-4e5c-9834-08cf7c708c26	fbe722a3-c870-4f78-b463-ed5a7cffbba8	d366a3c04f0b8eb50950b04501c60dee33cc64f1cb7abdcd908a310457a7ef5d	2026-03-18 10:33:43.92	\N	2026-03-11 10:33:43.921
ff643c29-a74d-43b1-914b-51ba7f121724	fbe722a3-c870-4f78-b463-ed5a7cffbba8	ad910ea17b37bc66a150eadbf6801f2c7949144fd1048003789a1fb4848abf60	2026-03-11 17:20:49.46	\N	2026-03-04 17:20:49.462
88e0ca93-2f2b-495c-8c19-592a3da8d97b	32445aeb-3f16-4e60-9bf2-d935bb4c197c	cb97073545192025ae1c3bf45bc0f7a3ae547f4696ae1ea05451c5f1dceacd48	2026-03-11 17:20:50.53	\N	2026-03-04 17:20:50.531
84b0c461-6cc0-4981-b50c-0f225af14b07	fbe722a3-c870-4f78-b463-ed5a7cffbba8	9630ef35f8b274a84fd708c5ab6b76688e5dba5a076bba3df7b65fb87fe076c8	2026-03-10 16:04:38.468	\N	2026-03-03 16:04:38.469
47c3b0f6-88f7-4a64-97e7-c5c6d0585b9d	32445aeb-3f16-4e60-9bf2-d935bb4c197c	cb97073545192025ae1c3bf45bc0f7a3ae547f4696ae1ea05451c5f1dceacd48	2026-03-11 17:20:50.841	\N	2026-03-04 17:20:50.843
eb1ffef9-3fc2-48a6-95e2-e9cd52c99306	8a0c6813-d988-4e81-b37a-4b5bbe4b5064	b50d284deba5b3f06d88961f203124bdbcb160f6044f77cf4f4eaa33792b8850	2026-03-11 17:20:51.221	\N	2026-03-04 17:20:51.222
73fc4f0e-c96d-4c80-9014-68af9daae2c9	fbe722a3-c870-4f78-b463-ed5a7cffbba8	6ee367993d7bc756c44354546103ffc36e95573be8150fc61fdafb3d4fb9da69	2026-03-10 22:44:54.667	2026-03-04 12:22:19.434	2026-03-03 22:44:54.668
0449a6e3-f187-459a-baa6-8853d2bb15c9	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.685	\N	2026-03-04 19:46:44.686
8ef285a3-fccb-4d04-8803-cee0463e4cdd	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0c878d38abe70e356ef4ca70991b63e30869b8f2bb6f3b7feaca6a3e368b0cef	2026-03-11 12:22:19.434	\N	2026-03-04 12:22:19.435
e49b4916-52a0-4693-b52e-b12a729dc74d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	74f16500c6f8877b8694f03157139a7514ca18053c4261bd521229180e1ac8ed	2026-03-11 19:31:37.168	2026-03-04 19:46:44.678	2026-03-04 19:31:37.17
4b044dcf-5ab5-4d92-9f24-0b2edda1eb3d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	4758409e7db62d8d3658a0ca3dec3962d7301b8e766a612b8c6b07d6c2ed88f9	2026-03-11 19:46:44.701	\N	2026-03-04 19:46:44.702
718395ba-b0be-475d-9c95-c7dcbbcf6b88	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0c878d38abe70e356ef4ca70991b63e30869b8f2bb6f3b7feaca6a3e368b0cef	2026-03-11 12:22:19.443	\N	2026-03-04 12:22:19.444
e7cc211d-b0f6-467b-8630-e1bf68d51bf4	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0c878d38abe70e356ef4ca70991b63e30869b8f2bb6f3b7feaca6a3e368b0cef	2026-03-11 12:22:19.414	2026-03-04 12:22:19.619	2026-03-04 12:22:19.417
00f6ae5e-7525-4cc7-a33f-b6b9799f7787	fbe722a3-c870-4f78-b463-ed5a7cffbba8	0c878d38abe70e356ef4ca70991b63e30869b8f2bb6f3b7feaca6a3e368b0cef	2026-03-11 12:22:19.63	\N	2026-03-04 12:22:19.631
871d22d4-ee86-4408-9551-7ec84e8d96c5	170de289-54b4-460f-867a-ea7adb3784ce	b554ed0bf92b46c9834028b1654a6efb5f7ea2021eed091e5fc0be0a10778c51	2026-03-11 20:23:17.39	\N	2026-03-04 20:23:17.392
f65da98a-ff97-4d0b-bd29-4d600854cbb7	170de289-54b4-460f-867a-ea7adb3784ce	70cb7b7666d6c86723cc1a9dd04f14f451650e99cd242b0a315df337c82440ea	2026-03-11 20:23:22.733	\N	2026-03-04 20:23:22.734
18ef528f-d83a-47d1-91a3-1861eae68a5c	94b2dc4f-f7ef-4e34-9c15-192983fc7439	b2ecc77334d0c67c620b0f3466c56263bd29e9785f8e6e9893cdc79ee6ee1f99	2026-03-11 20:24:09.8	\N	2026-03-04 20:24:09.801
680b5f99-c8bc-4888-bda7-9e2958a8714d	94b2dc4f-f7ef-4e34-9c15-192983fc7439	c5359f77440a356fd0e040e17de626a765b33bb6d422c3a44684520f7146a247	2026-03-11 20:26:24.059	\N	2026-03-04 20:26:24.06
568ed355-769d-45a5-82aa-adb7d77e5165	94b2dc4f-f7ef-4e34-9c15-192983fc7439	9aba480cb49cf8c639d99fa3842afacb8e91514196421fb0de628b6f4798084c	2026-03-11 20:40:28.304	\N	2026-03-04 20:40:28.305
b6ca3248-10bc-46ac-9a5b-bf792702ea26	170de289-54b4-460f-867a-ea7adb3784ce	64b5aa19a2f53636c00f48bf88d4dc8465293e484454472be7385bab4426eab8	2026-03-11 20:55:31.445	\N	2026-03-04 20:55:31.446
114b1e84-cff7-474f-a283-31cb740363d7	fbe722a3-c870-4f78-b463-ed5a7cffbba8	cf7b01d091397887bf91e4087c3053a865b7cff48b508701bbcfcb2add502273	2026-03-11 21:04:20.237	\N	2026-03-04 21:04:20.238
9edb02f5-4801-43c5-92c1-32ed9ca5d045	170de289-54b4-460f-867a-ea7adb3784ce	f6ccb5afffb8094c1e8552223d584ed804b7060fa159b655b9e180ede70fb07c	2026-03-11 21:06:22.621	\N	2026-03-04 21:06:22.622
29c3a68a-573b-4d5b-b2ba-ee10096f9b9a	170de289-54b4-460f-867a-ea7adb3784ce	84f8c8f3a6acfc9def2a734e6239e6bab0d1785d6c6272ae1070becf750534d7	2026-03-11 21:09:03.038	\N	2026-03-04 21:09:03.039
4b0bba58-5fc6-42f9-90a3-8d9e9f5d6294	fbe722a3-c870-4f78-b463-ed5a7cffbba8	3b37c014a00f1d9fde98a905e164eff8c5d979e0693d75709139752720240264	2026-03-11 21:36:08.209	\N	2026-03-04 21:36:08.21
3e4a81e6-14ef-4932-a7b4-ed2a28bbb36d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	b83edd42eeeade6f1bf9b861d0097eb12d970d0a0b036dda4fccbdd424c7bc22	2026-03-10 22:24:10.739	\N	2026-03-03 22:24:10.74
0a18d622-fc9e-4c17-b917-883ce89b498c	94b2dc4f-f7ef-4e34-9c15-192983fc7439	10d9adb9bad9d6ad40b7256c83300e6dafd8174c4623e390466b7cb97e5f3a4b	2026-03-11 21:39:36.035	\N	2026-03-04 21:39:36.037
5a5ffe89-83ed-4488-bb93-59773c2b54f1	170de289-54b4-460f-867a-ea7adb3784ce	fb34260fe5623aff00229e92c1496ad1b31a2dd80f59c231651d95feb249b1e6	2026-03-11 21:40:22.253	\N	2026-03-04 21:40:22.254
bcfc7096-6c71-481f-8994-c2ec4d4c5c7d	fbe722a3-c870-4f78-b463-ed5a7cffbba8	c0b353640b6d55d4d9e82856fbdfddb349c3b8558f1e39e2e5a1385877ba3db5	2026-03-11 14:05:03.719	\N	2026-03-04 14:05:03.72
d54c4c04-54a9-4d91-b10c-7e2f501fedf3	fbe722a3-c870-4f78-b463-ed5a7cffbba8	222d883bfa42597ec56d2110b790f3865281be1439dc1d57e9b5f0f9ce7c41c6	2026-03-11 21:42:55.078	\N	2026-03-04 21:42:55.08
0237ad80-038d-420b-ae2a-efaedb5f9ef6	170de289-54b4-460f-867a-ea7adb3784ce	9252c25dd22ba030af6ff6083bb08337d3accee4a554c89ae539df7d5f05484b	2026-03-11 21:44:28.486	\N	2026-03-04 21:44:28.487
afd84a12-62f4-4371-9573-e62c6b40f212	94b2dc4f-f7ef-4e34-9c15-192983fc7439	5366adfd69b9d423702b631a07c27fdaca06810364895078f82c23559c1130ea	2026-03-11 21:45:27.797	\N	2026-03-04 21:45:27.798
afbef4c5-fdf3-4abb-8fa2-2f0c69a0799d	170de289-54b4-460f-867a-ea7adb3784ce	136eee00b2ee816849b00fe34936a4cc2fb5d1f1672046d5856e66b141af9917	2026-03-11 21:46:33.721	\N	2026-03-04 21:46:33.723
ec029277-7d08-4978-8e25-50c835e72d05	fbe722a3-c870-4f78-b463-ed5a7cffbba8	5d97679922ef1277af61c91b504ce6dc50b006cce4a2f35a3799bbbd2026ccb0	2026-03-18 08:53:55.402	\N	2026-03-11 08:53:55.404
fcfb5f2b-c0fa-4190-a2db-4e87a0fc6034	170de289-54b4-460f-867a-ea7adb3784ce	7fca575e6e424772531e8cdcec0b95d629aa99cf7f5e9fdf8f6148a15f3578fc	2026-03-18 08:58:13.075	\N	2026-03-11 08:58:13.077
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password_hash, role, wallet_address, is_active, created_at, updated_at, logo_url) FROM stdin;
3ea29fb3-cae9-4faf-bfc1-9cfb2e324707	test.college.1533349947@cts.local	Test College	$2a$12$Ce77UNeGpCz/u2g6A4AvpO2unLySjv98eWFojwhuaUe8aqE51BRuG	college	0xtestwallet1234	f	2026-03-02 13:50:33.711	2026-03-02 13:50:33.744	\N
1e65fcfa-2dd2-42e3-9052-3ed57e782dab	test.user2@cts.local	testuser2	$2a$12$Oyc.UoR0LVxhWsxe5K8xP.KlQwrJHz2BHouV.SZzQZhGn7mK3kAXe	student	\N	t	2026-03-03 12:47:41.81	2026-03-03 12:47:41.81	\N
8a0c6813-d988-4e81-b37a-4b5bbe4b5064	smoke.college.1772652049@cts.local	Smoke College	$2a$12$RJDIwrF.Q1ACuyPemidzH.5.cIgoCTwsKqDuQ6wIPgCH97uvPfqCm	college	0x1111111111111111111111111111111111111111	t	2026-03-04 17:20:49.806	2026-03-04 17:20:49.806	\N
32445aeb-3f16-4e60-9bf2-d935bb4c197c	smoke.student.1772652049@cts.local	smoke_student	$2a$12$HjQv8gWoqZ1Vxx59L0YQhOcHrFJfgb.swc4hVljoYe5hksBpznjIG	student	0x3333333333333333333333333333333333333333	t	2026-03-04 17:20:50.523	2026-03-04 17:20:50.523	\N
170de289-54b4-460f-867a-ea7adb3784ce	asingizwejoie@gmail.com	joietest	$2a$12$rmsExTkB5qHzgQ7xfnEDkumBZv2iWhuebWyT6t7iXosx8svms84Hq	student	0xec9390a0a272141a60bc28c62ddaa56b33965cb3	t	2026-03-04 20:23:01.336	2026-03-04 20:23:01.336	\N
ad1d0302-5f17-44ce-a381-093108035ff9	smoke.dao.1772652049@cts.local	Smoke DAO	$2a$12$PImDrq47wPtgFbBpPe2uHuctW48M/hQfHV.oMhquk8e8jUi69/VRe	dao	0x2222222222222222222222222222222222222222	t	2026-03-04 17:20:50.17	2026-03-04 20:54:16.238	\N
94b2dc4f-f7ef-4e34-9c15-192983fc7439	saibaaubin@gmail.com	SUA	$2a$12$.8BiKhUcFyufcMLTWYP0FeEkl0u1yNJSlgd1rcSJ6BSl3AvxzWbLW	dao	0xc63582cf307902335cb3bc4edb9bd0127d806487	t	2026-03-04 19:40:38.261	2026-03-04 21:43:03.893	\N
fbe722a3-c870-4f78-b463-ed5a7cffbba8	admin@cts.local	system_admin	$2a$12$isLTnRCgympTVZt0CRAUwesG5TTk3txfcsk0yE64EWNPfeP6N9mTK	admin	0x52a176d6059b65daf15de8a047daf749ef457ec4	t	2026-02-27 08:42:07.143	2026-03-10 21:59:32.081	\N
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: college_applications college_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.college_applications
    ADD CONSTRAINT college_applications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: proposal_votes proposal_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_votes
    ADD CONSTRAINT proposal_votes_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: proposal_votes_proposal_id_voter_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX proposal_votes_proposal_id_voter_id_key ON public.proposal_votes USING btree (proposal_id, voter_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_wallet_address_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_wallet_address_key ON public.users USING btree (wallet_address);


--
-- Name: audit_logs audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: college_applications college_applications_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.college_applications
    ADD CONSTRAINT college_applications_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: college_applications college_applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.college_applications
    ADD CONSTRAINT college_applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_votes proposal_votes_proposal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_votes
    ADD CONSTRAINT proposal_votes_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposal_votes proposal_votes_voter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposal_votes
    ADD CONSTRAINT proposal_votes_voter_id_fkey FOREIGN KEY (voter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_college_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_college_id_fkey FOREIGN KEY (college_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict T8R4gqACeVhNTbdMertpJfwdARLbDaZwmCu49uMerAn3m6wpWWUOeyuP7Iw1VV8

