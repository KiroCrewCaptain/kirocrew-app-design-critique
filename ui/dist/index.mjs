import { activeLocale, fmtRelative, useAppApi, useImeGuard, useLanguageGeneration } from "@kirocrew/app-sdk";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, CornerDownLeft, GripVertical, Image, Loader2, Maximize2, PencilRuler, Plus, Sparkle, Trash2, Upload, Wrench, X } from "lucide-react";
import { Clickable, ErrorNotice } from "@kirocrew/app-sdk/ui";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/appApi.ts
var bound = null;
/** Called by the page root with `useAppApi()`. */
function bindAppApi(api) {
	bound = api;
}
function currentAppApi() {
	if (!bound) throw new Error("design-critique: the host API is not bound yet");
	return bound;
}
/** A refused request: the HTTP status, the raw body, and a readable message. */
var ApiError = class extends Error {
	status;
	body;
	constructor(status, message, body = "") {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.body = body;
	}
};
/** The server's own sentence for a refusal (`{"error": "..."}`), else `HTTP <status>`. */
function friendlyErrText(status, body) {
	try {
		const parsed = JSON.parse(body);
		if (parsed && typeof parsed === "object") {
			const err = parsed.error ?? parsed.message;
			if (typeof err === "string" && err.trim()) return err.trim();
		}
	} catch {}
	const text = body.trim();
	if (text && text.length <= 200 && !text.startsWith("<")) return text;
	return `HTTP ${status}`;
}
/** The scoped client's non-2xx (it carries `status` and `body`) as an `ApiError`;
*  anything else (a network failure, an abort) is returned unchanged. */
function toApiError(e) {
	const status = e?.status;
	if (typeof status !== "number") return e;
	const body = String(e.body ?? "");
	return new ApiError(status, friendlyErrText(status, body), body);
}
// src/i18n.ts
/**
* The app's own strings. A bundle cannot read the dashboard's catalogs (those
* belong to the host and change with it), so every locale the dashboard ships is
* bundled here and looked up against the host's active language.
*
* Lookup order: the exact locale (`pt`, `zh-CN`), then its base language, then
* English, then the key itself, so a missing translation shows English rather
* than nothing. `{{name}}` placeholders are filled from `vars`; one with no value
* is left as written.
*
* A numeric `count` picks a plural form the way the dashboard's i18next does:
* in each catalog of the chain, `<key>_zero` for 0 when it exists, then
* `<key>_<category>` for that catalog's own CLDR category (`one`, `few`,
* `many`, `other`; `Intl.PluralRules`), then the bare key. So `ru` reads its
* `_few` form for 3 while `ja` reads `_other` for every count.
*
* `t` reads the language at call time. The root component subscribes to the
* host's language changes (`useLanguageGeneration`), and its re-render reaches
* every child, so a language switch repaints the page without a reload.
*/
var CATALOGS = {
	bn: {
		askLayer: {
			"answer_failed_ask_again_below": "উত্তর দেওয়া যায়নি — নিচে আবার জিজ্ঞেস করো",
			"ask_a_follow_up": "আরেকটি প্রশ্ন করো…",
			"ask_again": "আবার জিজ্ঞেস করো…",
			"what_dont_you_understand_about_this": "এখানে কোনটা বুঝতে পারছ না?",
			"ask": "জিজ্ঞাসা",
			"ask_about_this": "এটি সম্পর্কে জিজ্ঞাসা করুন",
			"close": "বন্ধ করুন",
			"remove_this_annotation": "এই অ্যানোটেশন সরান",
			"thinking": "ভাবছে…",
			"question_label": "এই সমালোচনা নিয়ে তোমার প্রশ্ন"
		},
		composer: {
			"add_screens": "স্ক্রিন যোগ করুন",
			"add_screenshots_or_paste_a_link_first": "আগে স্ক্রিনশট যোগ করো বা একটি লিংক পেস্ট করো",
			"clear_all": "সব মুছুন",
			"critique_this_flow_count_screens_one": "এই ফ্লোর ক্রিটিক করো · {{count}}টি স্ক্রিন",
			"critique_this_flow_count_screens_other": "এই ফ্লোর ক্রিটিক করো · {{count}}টি স্ক্রিন",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "স্ক্রিনশট ড্রপ করুন — বা ব্রাউজ করতে ক্লিক করুন",
			"fix_my_access": "আমার অ্যাক্সেস ঠিক করো",
			"fix_the_link": "লিঙ্কটি ঠিক করুন",
			"hide_access_steps": "অ্যাক্সেসের ধাপ লুকাও",
			"move_earlier": "আগে সরান",
			"move_later": "পরে সরান",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "একটি স্ক্রিন, বা ফ্লোর জন্য ক্রমানুসারে কয়েকটি · PNG, JPG, WebP",
			"remove": "সরান",
			"remove_name": "{{name}} সরাও",
			"send_screenshots": "স্ক্রিনশট পাঠান",
			"start_the_critique": "ক্রিটিক শুরু করো",
			"step_n": "ধাপ {{n}}",
			"try_again": "আবার চেষ্টা করুন",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "পরিবর্তে একটি লোকাল ফোল্ডার ব্যবহার করুন",
			"start_kind_figma": "Figma ফাইলের সমালোচনা করো",
			"start_kind_repo": "রিপোজিটরির সমালোচনা করো",
			"start_kind_local": "লোকাল কোডের সমালোচনা করো",
			"start_kind_url": "চলমান অ্যাপের সমালোচনা করো",
			"start_this": "এটির সমালোচনা করো",
			"start_plain": "সমালোচনা করো",
			"staged_one_hint": "1টি স্ক্রিন · ফ্লো হিসেবে সমালোচনা করতে আরেকটি যোগ করো।",
			"staged_flow_hint_one": "{{n}}টি স্ক্রিন · এই ক্রমই ফ্লোর ক্রম — শুরু করার আগে ক্রম বদলাও বা সরাও।",
			"staged_flow_hint_other": "{{n}}টি স্ক্রিন · এই ক্রমই ফ্লোর ক্রম — শুরু করার আগে ক্রম বদলাও বা সরাও।",
			"title_blocked": "আমি ঢুকতে পারিনি",
			"title_ask": "আমি কীসের সমালোচনা করব?",
			"link_placeholder_staged": "তোমার স্ক্রিনশট ব্যবহার হচ্ছে — লিংকের সমালোচনা করতে সেগুলো সরাও",
			"link_placeholder": "Figma লিংক · git রিপোজিটরি · এই মেশিনের একটি ফোল্ডার · একটি চলমান URL (localhost বা ডিপ্লয় করা প্রিভিউ)",
			"link_label": "সমালোচনার লিংক",
			"render_before_judging": "বিচার করার আগে আমি সবকিছু রেন্ডার করি — শুধু কোড দেখে কখনো নয়। তোমার অ্যাপ যদি আগে থেকেই চলে, তাহলে তার URL পেস্ট করো, আমি অনুমানের বদলে আসল রং আর মাপ মাপতে পারব।"
		},
		constants: {
			"blocked_figma_app_missing_hint": "Figma ডেস্কটপে ফাইলটা খোলো আর আবার চেষ্টা করো, বা ফ্রেমগুলো PNG হিসেবে এক্সপোর্ট করে এখানে ফেলে দাও।",
			"blocked_figma_app_missing_say": "আমি Figma-তে পৌঁছাতে পারছি না — ডেস্কটপ অ্যাপ চলছে না, বা আমার কাছে Figma টুলগুলো নেই।",
			"blocked_figma_export_needed_hint": "প্রতিটা ফ্রেম PNG হিসেবে এক্সপোর্ট করে স্ক্রিনশট হিসেবে এখানে ছেড়ে দাও — আমি তো পিক্সেলই দেখি।",
			"blocked_figma_export_needed_say": "এখানে আমি Figma লিঙ্ক থেকে সরাসরি ফ্রেম টেনে আনতে পারি না — আমার কাছে Figma ডেস্কটপ টুল নেই।",
			"blocked_figma_file_closed_hint": "Figma ডেস্কটপে এটা খোলো, তারপর আবার চেষ্টা করো।",
			"blocked_figma_file_closed_say": "Figma চলছে, কিন্তু সেই ফাইলটা খোলা নেই।",
			"blocked_figma_no_permission_auth_lead": "Figma-র অ্যাক্সেস অ্যাকাউন্ট ধরে দেওয়া হয়, আর ডেস্কটপ অ্যাপে যা খোলা থাকে আমি শুধু সেটাই পড়ি — আমার নিজের কোনো লগইন নেই। কীভাবে ঠিক করবে তা এখানে দেওয়া আছে।",
			"blocked_figma_no_permission_auth_step_1": "1. ফাইলের মালিককে বলো তোমার Figma অ্যাকাউন্টের সঙ্গে এটা শেয়ার করতে",
			"blocked_figma_no_permission_auth_step_2": "2. Figma ডেস্কটপে এটা খোলো",
			"blocked_figma_no_permission_auth_step_3": "3. ফিরে এসে আবার চেষ্টা করার বোতামে চাপো",
			"blocked_figma_no_permission_auth_tail": "অ্যাক্সেস যদি না আসে, ফ্রেমগুলো PNG হিসেবে এক্সপোর্ট করলেও একই কাজ হয় — পিক্সেল দেখেই আমি সমালোচনা করি।",
			"blocked_figma_no_permission_hint": "অ্যাক্সেস চেয়ে নাও, বা ফ্রেমগুলো PNG হিসেবে এক্সপোর্ট করে এখানে ফেলে দাও।",
			"blocked_figma_no_permission_say": "তোমার Figma অ্যাকাউন্ট সেই ফাইলটা দেখতে পারে না।",
			"blocked_no_access_hint": "যদি তোমার কাছে চেকআউট করা থাকে, বদলে আমাকে ফোল্ডারের পাথ দাও।",
			"blocked_no_access_say": "সেই রিপোটা খুলতে পারলাম না। হয় এটা প্রাইভেট (আর আমার কাছে এর কোনো ক্রেডেনশিয়াল নেই), নয়তো এটার অস্তিত্বই নেই — GitHub দুটোর জন্যই একই এরর দেয়।",
			"blocked_not_found_hint": "মালিক আর নাম মিলিয়ে দেখো, বা আমাকে একটা লোকাল ফোল্ডারের পাথ দাও।",
			"blocked_not_found_say": "সেই URL-এ ওই রিপোর অস্তিত্ব নেই।",
			"blocked_other_hint": "স্ক্রিনশটই এটা এড়ানোর সবচেয়ে দ্রুত উপায়।",
			"blocked_other_say": "ওটার ভেতরে ঢুকতে পারলাম না।",
			"kind_figma": "Figma ফাইল",
			"kind_local": "লোকাল কোড",
			"kind_repo": "রিপো",
			"kind_url": "চালু থাকা অ্যাপ",
			"scan_finding_screens": "স্ক্রিনগুলো খোঁজা হচ্ছে",
			"scan_grouping_flows": "সম্ভাব্য ফ্লো অনুযায়ী সাজানো হচ্ছে",
			"scan_which_renderable": "কোনগুলো রেন্ডার করতে পারব তা বের করা হচ্ছে",
			"sev_catastrophe": "বিপর্যয়",
			"sev_cosmetic": "সৌন্দর্যগত",
			"sev_major": "গুরুতর",
			"sev_minor": "সামান্য",
			"stage_checking_hierarchy": "হায়ারার্কি, কনট্রাস্ট ও কনটেন্ট যাচাই করা হচ্ছে",
			"stage_double_checking": "প্রতিটি ফলাফল আবার মিলিয়ে দেখা হচ্ছে",
			"stage_getting_pixels": "দেখার জন্য আসল পিক্সেল আনা হচ্ছে",
			"stage_reading_screens": "স্ক্রিনগুলো পড়া হচ্ছে",
			"stage_weighing_task": "কাজের সঙ্গে মিলিয়ে বিচার করা হচ্ছে",
			"stage_writing_up": "সমালোচনা লেখা হচ্ছে",
			"wait_figma": "Figma ফাইল খোলা হচ্ছে আর তার ফ্রেমগুলোর তালিকা করা হচ্ছে…",
			"wait_local": "রুট খুঁজতে কোড স্ক্যান করা হচ্ছে…",
			"wait_repo": "রিপো ক্লোন করা হচ্ছে আর তার রুটগুলোর তালিকা করা হচ্ছে…",
			"wait_url": "পেজ লোড করা হচ্ছে আর তার লিঙ্কগুলো অনুসরণ করা হচ্ছে…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "একটি ক্রিটিক এখনও চলছে — দেখতে ক্লিক করুন",
			"across_the_flow": "ফ্লো জুড়ে",
			"click_to_enlarge": "বড় করতে ক্লিক করো",
			"close_esc": "বন্ধ করুন (Esc)",
			"couldn_t_see": "দেখা যায়নি",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "এটা কী বুঝতে পারিনি। একটি Figma লিংক, GitHub/GitLab/Bitbucket রেপো, একটি absolute লোকাল পাথ, বা ইতিমধ্যে চালু থাকা একটি URL দিন।",
			"critique_ready": "ক্রিটিক প্রস্তুত",
			"critique_untitled": "ক্রিটিক",
			"design_critique": "Design Critique",
			"enlarge": "বড় করুন",
			"full_size": "পূর্ণ আকার",
			"full_size_view": "পূর্ণ আকারে দেখুন",
			"history_count": "ইতিহাস ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "আমি ঢুকতে পেরেছি, কিন্তু ভেতরে রেন্ডার করার মতো কিছু নেই। বরং স্ক্রিনশট ছেড়ে দাও।",
			"new": "নতুন",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "দেখানোর মতো কোনো স্ক্রিন নেই — এটির জন্য ক্রিটিক পিক্সেল পায়নি। প্যানেলে \"দেখা যায়নি\" দেখুন।",
			"nothing_major": "বড় কিছু নেই",
			"numbered_pins_mark_issues_on_this_screen": "নম্বর দেওয়া পিন এই স্ক্রিনের সমস্যা চিহ্নিত করে",
			"on_screen": "● স্ক্রিনে",
			"only_added_the_first_room_the_limit_is_max_screens": "শুধু প্রথম {{room}}টি যোগ করা হয়েছে — সীমা {{max}} স্ক্রিন।",
			"pick_a_step_above": "ওপরে একটি ধাপ বেছে নাও",
			"point_me_at_a_running_url": "একটি চলমান URL আমাকে দেখান",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "একটি স্ক্রিন — বা একটি পূর্ণ ফ্লো — আমাকে দেখান, আর আমি একজন ডিজাইনার বন্ধুর মতো করে সেটি পড়ব: কী কাজ করছে, কী আরও নিখুঁত করা যায়, এবং কেন।",
			"running": "চলছে",
			"screen_heading": "স্ক্রিন",
			"screens_in_order": "ক্রমানুসারে স্ক্রিন",
			"see_an_example": "একটি উদাহরণ দেখুন",
			"send_screenshots": "স্ক্রিনশট পাঠান",
			"show_this_screen": "এই স্ক্রিনটি দেখান",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "নতুন একটি ক্রিটিক শুরু করুন — চলমান যেকোনো কিছু চলতে থাকবে",
			"step_n": "ধাপ {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "ক্রিটিক পাল্টান",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "এটাই {{max}} স্ক্রিনের সীমা।",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "যা আমি আরও নিখুঁত করতাম",
			"what_s_working": "যা কাজ করছে",
			"what_you_ll_get": "আপনি যা পাবেন",
			"your_critiques": "আপনার ক্রিটিকগুলো",
			"your_question_click_to_see_the_answer": "আপনার প্রশ্ন — উত্তর দেখতে ক্লিক করুন",
			"rail_uploading": "আপলোড হচ্ছে…",
			"rail_reading": "তোমার ডিজাইন পড়া হচ্ছে…",
			"rail_flow_one": "{{n}}টি স্ক্রিনের একটি ফ্লো — এদের মাঝের রূপান্তরও দেখব।",
			"rail_flow_other": "{{n}}টি স্ক্রিনের একটি ফ্লো — এদের মাঝের রূপান্তরও দেখব।",
			"rail_one_screen": "একটি স্ক্রিন।",
			"rail_pending_figma": "একটি Figma ফাইল — বিচারের আগে রেন্ডার হচ্ছে।",
			"rail_pending_repo": "একটি রিপোজিটরি — বিচারের আগে রেন্ডার হচ্ছে।",
			"rail_pending_local": "লোকাল কোড — বিচারের আগে রেন্ডার হচ্ছে।",
			"rail_pending_url": "একটি চলমান অ্যাপ — বিচারের আগে রেন্ডার হচ্ছে।",
			"rail_pending_design": "একটি ডিজাইন — বিচারের আগে রেন্ডার হচ্ছে।",
			"rail_getting_ready": "স্ক্রিন প্রস্তুত করা হচ্ছে।",
			"critique_ready_fallback": "সমালোচনা তৈরি",
			"ask_too_long": "অনেক সময় লেগেছে — আবার জিজ্ঞেস করো।",
			"ask_went_wrong": "কিছু একটা ভুল হয়েছে।",
			"entry_meta_screens_one": "{{n}}টি স্ক্রিন · {{when}}",
			"entry_meta_screens_other": "{{n}}টি স্ক্রিন · {{when}}",
			"findings_count_one": "{{n}}টি মন্তব্য",
			"findings_count_other": "{{n}}টি মন্তব্য",
			"nothing_flagged": "কিছু চিহ্নিত হয়নি",
			"design_critique_fallback": "ডিজাইন সমালোচনা",
			"flow_screens_count_one": "{{n}}টি স্ক্রিন",
			"flow_screens_count_other": "{{n}}টি স্ক্রিন",
			"screen_n": "স্ক্রিন {{n}}",
			"get_overall_read": "এটি কেমন চলছে তার সামগ্রিক মূল্যায়ন",
			"get_whats_working": "যা কাজ করছে, যাতে পরের সংশোধনেও টিকে থাকে",
			"get_top_things": "শক্ত করার প্রধান বিষয়গুলো, স্ক্রিনে চিহ্নসহ",
			"no_critiques_narrow": "এখনও কোনো সমালোচনা নেই। নিচে একটি স্ক্রিনশট দাও।",
			"no_critiques_wide": "এখনও কোনো সমালোচনা নেই। প্যানেলে একটি স্ক্রিনশট দাও →",
			"the_design_alt": "ডিজাইন"
		},
		findingRow: {
			"based_on": "যার ভিত্তিতে",
			"finding": "পর্যবেক্ষণ",
			"fix": "সমাধান",
			"suggestion": "পরামর্শ",
			"what_i_saw": "আমি যা দেখেছি",
			"where": "কোথায়",
			"steps_range": "ধাপ {{range}}",
			"flow_badge": "ফ্লো"
		},
		manifest: {
			"description": "সহকর্মীকে জিজ্ঞেস করার আগেই চালিয়ে নেওয়ার মতো একটি ডিজাইন পর্যালোচনা। একটি স্ক্রিনশট, পুরো একটি বহু-স্ক্রিনের ফ্লো, একটি Figma ফাইল, একটি git রিপো, বা চালু আছে এমন একটি URL দাও — এটি সম্ভাব্য স্ক্রিনগুলো খুঁজে বের করে, কোনটা দেখা হবে তা তোমাকে বেছে নিতে দেয়, তারপর অভিজ্ঞ ডিজাইনারের মতোই জানায়: সামগ্রিক একটি পাঠ, কী কাজ করছে, আর কী কী আঁটসাঁট করা দরকার — প্রতিটির সঙ্গে একটি নামধারী হিউরিস্টিক জোড়া থাকে। বহু-স্ক্রিনের ফ্লোতে এমন আন্তঃ-স্ক্রিন ফলাফলও আসে যা একটি স্ক্রিন দেখে বোঝা যায় না — অসংগত কন্ট্রোল, অগ্রগতির খবর না থাকা, ফিরে যাওয়ার পথ না থাকা, মুখবন্ধ গলি। কোড আর Figma বিচার করার আগে সেগুলো রেন্ডার করে নেয়, তাই যা সত্যিই দেখেনি তার সমালোচনা কখনও করে না; আর কোন স্ক্রিনে পৌঁছাতে পারেনি তা অনুমান না করে স্পষ্ট করেই বলে দেয়।",
			"display_name": "Design Critique",
			"use_case_1": "একটি screen বা সম্পূর্ণ product flow পর্যালোচনা করে দৃশ্যমান অংশের সঙ্গে যুক্ত, গুরুত্ব অনুযায়ী সাজানো, heuristic-ভিত্তিক ফলাফল পান।",
			"configuration_1": "কোনো সেটআপ ছাড়া review-এর জন্য screenshot দিন, অথবা Figma file, repository, local folder কিংবা আগে থেকেই চলা URL দিন; private GitHub source-এর জন্য gh auth login লাগতে পারে।",
			"highlight_1": "স্ক্রিনশট, একটি Figma লিঙ্ক, একটি git রিপো, একটি লোকাল ফোল্ডার বা চালু থাকা একটি URL নেয় — আর শুরু করার আগে কী পেল তা জানিয়ে দেয়",
			"highlight_2": "ছবি দেখে অনুমান না করে রেন্ডার হওয়া পেজ থেকেই কনট্রাস্ট আর ট্যাপ-লক্ষ্যের আকার মাপে",
			"highlight_3": "বহু-স্ক্রিনের ফ্লোতে আন্তঃ-স্ক্রিন পরীক্ষা হয়: কন্ট্রোলের সংগতি, অগ্রগতি, ফিরে যাওয়ার পথ, একই জিনিস বারবার চাওয়া, মুখবন্ধ গলি",
			"highlight_4": "প্রতিটি ফলাফলের পেছনের হিউরিস্টিকের নাম দেওয়া থাকে (Nielsen 1-10, WCAG, Gestalt, Fitts) এবং NN/g 1-4 স্কেলে তার তীব্রতা বলা থাকে",
			"highlight_5": "রিপোর্টের যেকোনো লাইন বেছে নিয়ে সেখানেই সেটি নিয়ে বাড়তি প্রশ্ন করো",
			"highlight_6": "ফাঁকা বা আটকে থাকা স্ক্রিনের সমালোচনা না করে, কী দেখতে পারেনি সেটাই জানায়",
			"highlight_7": "যে কাজ রিভিউ করে তাতে হাত দেয় না: ওই প্রজেক্টের ডিপেন্ডেন্সি ইনস্টল করে না, তার স্ক্রিপ্ট চালায় না, ডেভ সার্ভার চালু করে না, ফাইলও সম্পাদনা করে না",
			"highlight_8": "ছবি তুলতে এটি একটি হেডলেস ব্রাউজার ব্যবহার করে — প্রথম ব্যবহারে একবার তোমার হোম ডিরেক্টরির ক্যাশে নামে, প্রজেক্টের ভেতরে কখনও নয়",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "এই ফ্লোর ক্রিটিক করো · {{count}}টি স্ক্রিন",
			"critique_this_flow_count_screens_other": "এই ফ্লোর ক্রিটিক করো · {{count}}টি স্ক্রিন",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "ক্রম পাল্টাতে টেনে আনুন",
			"move_earlier": "আগে সরান",
			"move_later": "পরে সরান",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "ঐচ্ছিক ব্রিফ: এটি কার জন্য, এবং মূল কাজটি কী?",
			"optional_who_is_it_for_and_what_s_the_main_task": "ঐচ্ছিক: এটি কার জন্য, এবং মূল কাজটি কী?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "স্ক্রিন",
			"start_over": "আবার শুরু করুন",
			"suggested_flows": "প্রস্তাবিত ফ্লো",
			"what_should_i_audit": "আমি কী অডিট করব?",
			"screens_found_count_one": "{{n}}টি স্ক্রিন পাওয়া গেছে · {{m}}টি রেন্ডার করতে পারি",
			"screens_found_count_other": "{{n}}টি স্ক্রিন পাওয়া গেছে · {{m}}টি রেন্ডার করতে পারি",
			"flow_n": "ফ্লো {{n}}",
			"picked_count_one": "{{n}}টি বাছাই",
			"picked_count_other": "{{n}}টি বাছাই",
			"hint_order": "নম্বরগুলো আমি যে ক্রমে দেখব — ক্রম বদলাতে একটি সারি টেনে নাও, বা কিবোর্ডে ‹ › ব্যবহার করো।",
			"hint_pick": "বাছাই করতে একটি স্ক্রিনে ক্লিক করো। ফ্লো হিসেবে সমালোচনার জন্য কয়েকটি বাছাই করো।",
			"cant_render_title": "এটি আমি রেন্ডার করতে পারি না",
			"cant_render_short": "রেন্ডার হবে না",
			"group_fallback": "স্ক্রিন",
			"tag_from_links": "লিংক থেকে",
			"tag_guess": "অনুমান"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "আমি এটি ক্যাপচার করে আসল কনট্রাস্ট আর মাপ মাপব।",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "আমি এটি ক্লোন করে স্ক্রিনগুলোর তালিকা করব। সার্ভার ছাড়া রেন্ডার হয় এমন পেজই শুধু দেখা যায়।",
			"i_ll_list_the_screens_only_pages_that_render_wit": "আমি স্ক্রিনগুলোর তালিকা করব। সার্ভার ছাড়া রেন্ডার হয় এমন পেজই শুধু দেখা যায়।",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "এটি এখনই চালু থাকতে হবে। আমি লাইভ ক্যাপচার করে আসল কনট্রাস্ট আর মাপ মাপব।",
			"not_something_i_recognise_give_me_a_figma_link_a": "আমি এটি চিনতে পারছি না। আমাকে একটি Figma লিংক, GitHub রিপোজিটরি, পূর্ণ লোকাল পাথ বা ইতিমধ্যে চালু একটি URL দাও।",
			"screen_fallback": "স্ক্রিন"
		},
		waitingScreen: {
			"cancel_this_run": "এই রানটি বাতিল করুন",
			"stop_this_run_and_discard_it": "এই রান থামিয়ে বাতিল করুন",
			"getting_screens_ready": "স্ক্রিন প্রস্তুত করা হচ্ছে…",
			"title_scanning": "অডিটের জন্য স্ক্রিন খুঁজছি",
			"title_uploading_screens_one": "{{n}}টি স্ক্রিন আপলোড হচ্ছে…",
			"title_uploading_screens_other": "{{n}}টি স্ক্রিন আপলোড হচ্ছে…",
			"title_uploading_one": "তোমার স্ক্রিনশট আপলোড হচ্ছে…",
			"title_reading_flow_one": "তোমার ফ্লো পড়ছি · {{n}}টি স্ক্রিন",
			"title_reading_flow_other": "তোমার ফ্লো পড়ছি · {{n}}টি স্ক্রিন",
			"title_reading_screen": "তোমার স্ক্রিন পড়ছি",
			"title_getting_pixels": "আগে আসল পিক্সেল নিচ্ছি",
			"foot_still_going": "এখনও চলছে — ঘন ফ্লোতে কয়েক মিনিট লাগতে পারে। তুমি এই পেজ ছেড়ে যেতে পারো; সমালোচনা চলতে থাকবে আর ফিরে এলে এখানেই পাবে।",
			"foot_navigate_away": "তুমি এই পেজ ছেড়ে যেতে পারো — সমালোচনা চলতে থাকবে।"
		},
		common: {
			"send_failed": "পাঠানো যায়নি",
			"unexpected_server_response": "সার্ভার থেকে অপ্রত্যাশিত সাড়া"
		}
	},
	de: {
		askLayer: {
			"answer_failed_ask_again_below": "Antwort fehlgeschlagen — frag unten noch mal",
			"ask_a_follow_up": "Folgefrage stellen…",
			"ask_again": "Noch mal fragen…",
			"what_dont_you_understand_about_this": "Was verstehst du daran nicht?",
			"ask": "Fragen",
			"ask_about_this": "Dazu fragen",
			"close": "Schließen",
			"remove_this_annotation": "Diese Anmerkung entfernen",
			"thinking": "Denkt nach…",
			"question_label": "Deine Frage zu dieser Kritik"
		},
		composer: {
			"add_screens": "Screens hinzufügen",
			"add_screenshots_or_paste_a_link_first": "Füge zuerst Screenshots hinzu oder füge einen Link ein",
			"clear_all": "Alle entfernen",
			"critique_this_flow_count_screens_one": "Diesen Flow kritisieren · {{count}} Screen",
			"critique_this_flow_count_screens_other": "Diesen Flow kritisieren · {{count}} Screens",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Screenshots ablegen — oder zum Durchsuchen klicken",
			"fix_my_access": "Meinen Zugriff reparieren",
			"fix_the_link": "Link korrigieren",
			"hide_access_steps": "Zugriffsschritte ausblenden",
			"move_earlier": "Nach vorne",
			"move_later": "Nach hinten",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "ein Screen oder mehrere in Reihenfolge für einen Flow · PNG, JPG, WebP",
			"remove": "Entfernen",
			"remove_name": "{{name}} entfernen",
			"send_screenshots": "Screenshots senden",
			"start_the_critique": "Kritik starten",
			"step_n": "Schritt {{n}}",
			"try_again": "Erneut versuchen",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Stattdessen einen lokalen Ordner verwenden",
			"start_kind_figma": "Figma-Datei kritisieren",
			"start_kind_repo": "Repo kritisieren",
			"start_kind_local": "Lokalen Code kritisieren",
			"start_kind_url": "Laufende App kritisieren",
			"start_this": "Das hier kritisieren",
			"start_plain": "Kritisieren",
			"staged_one_hint": "1 Bildschirm · füge einen weiteren hinzu, um sie als Ablauf zu kritisieren.",
			"staged_flow_hint_one": "{{n}} Bildschirm · diese Reihenfolge ist die Ablaufreihenfolge — sortiere um oder entferne vor dem Start.",
			"staged_flow_hint_other": "{{n}} Bildschirme · diese Reihenfolge ist die Ablaufreihenfolge — sortiere um oder entferne vor dem Start.",
			"title_blocked": "Ich bin nicht hineingekommen",
			"title_ask": "Was soll ich kritisieren?",
			"link_placeholder_staged": "Deine Screenshots werden verwendet — entferne sie, um stattdessen einen Link zu kritisieren",
			"link_placeholder": "Figma-Link · Git-Repo · ein Ordner auf diesem Rechner · eine laufende URL (localhost oder eine bereitgestellte Vorschau)",
			"link_label": "Link zum Kritisieren",
			"render_before_judging": "Ich rendere alles, bevor ich es beurteile — nie nur anhand des Codes. Wenn deine App schon läuft, füge ihre URL ein, dann kann ich echte Farben und Größen messen, statt sie zu schätzen."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Öffne die Datei in Figma Desktop und versuche es erneut, oder exportiere die Frames als PNGs und lege sie hier ab.",
			"blocked_figma_app_missing_say": "Ich erreiche Figma nicht — die Desktop-App läuft nicht, oder mir stehen die Figma-Werkzeuge nicht zur Verfügung.",
			"blocked_figma_export_needed_hint": "Exportiere jedes Frame als PNG und zieh sie als Screenshots hier rein — die Pixel kritisiere ich so oder so.",
			"blocked_figma_export_needed_say": "Frames direkt aus einem Figma-Link kann ich hier nicht ziehen — ich habe die Figma-Desktop-Tools nicht am Start.",
			"blocked_figma_file_closed_hint": "Öffne sie in Figma Desktop und versuche es dann erneut.",
			"blocked_figma_file_closed_say": "Figma läuft, aber diese Datei ist nicht geöffnet.",
			"blocked_figma_no_permission_auth_lead": "Der Figma-Zugriff gilt pro Konto, und ich lese, was die Desktop-App gerade geöffnet hat — eine eigene Anmeldung habe ich nicht. So behebst du es.",
			"blocked_figma_no_permission_auth_step_1": "1. Bitte den Eigentümer der Datei, sie für dein Figma-Konto freizugeben",
			"blocked_figma_no_permission_auth_step_2": "2. Öffne sie in Figma Desktop",
			"blocked_figma_no_permission_auth_step_3": "3. Komm zurück und drücke auf „Erneut versuchen“",
			"blocked_figma_no_permission_auth_tail": "Wenn der Zugriff nicht klappt, funktioniert der Export der Frames als PNGs genauso gut — ich kritisiere ohnehin Pixel.",
			"blocked_figma_no_permission_hint": "Bitte um Zugriff, oder exportiere die Frames als PNGs und lege sie hier ab.",
			"blocked_figma_no_permission_say": "Dein Figma-Konto darf diese Datei nicht ansehen.",
			"blocked_no_access_hint": "Wenn du es ausgecheckt hast, gib mir stattdessen den Ordnerpfad.",
			"blocked_no_access_say": "Ich konnte dieses Repo nicht öffnen. Es ist entweder privat (und ich habe keine Anmeldedaten dafür) oder es existiert nicht — GitHub gibt für beides denselben Fehler zurück.",
			"blocked_not_found_hint": "Prüfe Eigentümer und Namen, oder gib mir einen lokalen Ordnerpfad.",
			"blocked_not_found_say": "Dieses Repo existiert unter dieser URL nicht.",
			"blocked_other_hint": "Screenshots sind der schnellste Weg darum herum.",
			"blocked_other_say": "Ich konnte darauf nicht zugreifen.",
			"kind_figma": "Figma-Datei",
			"kind_local": "lokaler Code",
			"kind_repo": "Repo",
			"kind_url": "laufende App",
			"scan_finding_screens": "Die Screens werden gesucht",
			"scan_grouping_flows": "Gruppierung in wahrscheinliche Flows",
			"scan_which_renderable": "Ich ermittle, welche ich rendern kann",
			"sev_catastrophe": "Katastrophe",
			"sev_cosmetic": "Kosmetisch",
			"sev_major": "Schwer",
			"sev_minor": "Leicht",
			"stage_checking_hierarchy": "Hierarchie, Kontrast und Inhalt werden geprüft",
			"stage_double_checking": "Jeder Befund wird gegengeprüft",
			"stage_getting_pixels": "Echte Pixel zum Ansehen werden geholt",
			"stage_reading_screens": "Die Screens werden gelesen",
			"stage_weighing_task": "Abwägung gegen die Aufgabe",
			"stage_writing_up": "Die Kritik wird verfasst",
			"wait_figma": "Die Figma-Datei wird geöffnet und ihre Frames werden aufgelistet…",
			"wait_local": "Der Code wird nach Routen durchsucht…",
			"wait_repo": "Das Repo wird geklont und seine Routen werden aufgelistet…",
			"wait_url": "Die Seite wird geladen und ihren Links wird gefolgt…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Eine Kritik läuft noch — zum Ansehen klicken",
			"across_the_flow": "Über den gesamten Flow",
			"click_to_enlarge": "Zum Vergrößern klicken",
			"close_esc": "Schließen (Esc)",
			"couldn_t_see": "Nicht sichtbar",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "Ich konnte nicht erkennen, was das ist. Gib mir einen Figma-Link, ein GitHub/GitLab/Bitbucket-Repo, einen absoluten lokalen Pfad oder eine URL, die bereits läuft.",
			"critique_ready": "Kritik fertig",
			"critique_untitled": "Kritik",
			"design_critique": "Design Critique",
			"enlarge": "Vergrößern",
			"full_size": "volle Größe",
			"full_size_view": "Ansicht in voller Größe",
			"history_count": "Verlauf ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Ich bin reingekommen, aber da ist nichts, was ich rendern kann. Wirf stattdessen Screenshots rein.",
			"new": "Neu",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "Keine Screens zum Anzeigen — für diesen konnten keine Pixel erfasst werden. Siehe „Nicht sichtbar“ im Panel.",
			"nothing_major": "nichts Gravierendes",
			"numbered_pins_mark_issues_on_this_screen": "nummerierte Pins markieren Probleme auf diesem Screen",
			"on_screen": "● auf dem Screen",
			"only_added_the_first_room_the_limit_is_max_screens": "Nur die ersten {{room}} hinzugefügt — das Limit liegt bei {{max}} Screens.",
			"pick_a_step_above": "wähle oben einen Schritt",
			"point_me_at_a_running_url": "Zeigen Sie mir eine laufende URL",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Zeigen Sie mir einen Screen — oder einen ganzen Flow — und ich lese ihn so, wie es ein befreundeter Designer tun würde: was funktioniert, was sich verfeinern lässt und warum.",
			"running": "läuft",
			"screen_heading": "Screen",
			"screens_in_order": "Screens in Reihenfolge",
			"see_an_example": "Beispiel ansehen",
			"send_screenshots": "Screenshots senden",
			"show_this_screen": "Diesen Screen anzeigen",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Neue Kritik starten — bereits laufende Kritiken laufen weiter",
			"step_n": "Schritt {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "Kritik wechseln",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "Das ist das Limit von {{max}} Screens.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "Was ich verfeinern würde",
			"what_s_working": "Was funktioniert",
			"what_you_ll_get": "Was Sie erhalten",
			"your_critiques": "Ihre Kritiken",
			"your_question_click_to_see_the_answer": "Ihre Frage — zum Anzeigen der Antwort klicken",
			"rail_uploading": "Wird hochgeladen…",
			"rail_reading": "Dein Design wird gelesen…",
			"rail_flow_one": "Ein Ablauf aus {{n}} Bildschirm — ich prüfe auch die Übergänge dazwischen.",
			"rail_flow_other": "Ein Ablauf aus {{n}} Bildschirmen — ich prüfe auch die Übergänge dazwischen.",
			"rail_one_screen": "Ein Bildschirm.",
			"rail_pending_figma": "Eine Figma-Datei — wird gerendert, bevor ich sie beurteile.",
			"rail_pending_repo": "Ein Repo — wird gerendert, bevor ich es beurteile.",
			"rail_pending_local": "Lokaler Code — wird gerendert, bevor ich ihn beurteile.",
			"rail_pending_url": "Eine laufende App — wird gerendert, bevor ich sie beurteile.",
			"rail_pending_design": "Ein Design — wird gerendert, bevor ich es beurteile.",
			"rail_getting_ready": "Die Bildschirme werden vorbereitet.",
			"critique_ready_fallback": "Kritik fertig",
			"ask_too_long": "Das hat zu lange gedauert — frag noch einmal.",
			"ask_went_wrong": "Etwas ist schiefgelaufen.",
			"entry_meta_screens_one": "{{n}} Bildschirm · {{when}}",
			"entry_meta_screens_other": "{{n}} Bildschirme · {{when}}",
			"findings_count_one": "{{n}} Befund",
			"findings_count_other": "{{n}} Befunde",
			"nothing_flagged": "nichts markiert",
			"design_critique_fallback": "Designkritik",
			"flow_screens_count_one": "{{n}} Bildschirm",
			"flow_screens_count_other": "{{n}} Bildschirme",
			"screen_n": "Bildschirm {{n}}",
			"get_overall_read": "Eine Gesamteinschätzung, wie es steht",
			"get_whats_working": "Was funktioniert, damit es die nächste Runde übersteht",
			"get_top_things": "Die wichtigsten Punkte zum Nachschärfen, mit Markierungen auf dem Bildschirm",
			"no_critiques_narrow": "Noch keine Kritiken. Lege unten einen Screenshot ab.",
			"no_critiques_wide": "Noch keine Kritiken. Lege einen Screenshot im Bereich ab →",
			"the_design_alt": "Das Design"
		},
		findingRow: {
			"based_on": "Basierend auf",
			"finding": "Befund",
			"fix": "Korrektur",
			"suggestion": "Vorschlag",
			"what_i_saw": "Was ich gesehen habe",
			"where": "Wo",
			"steps_range": "Schritte {{range}}",
			"flow_badge": "Ablauf"
		},
		manifest: {
			"description": "Eine Design-Kritik, die du einholen kannst, bevor du jemanden im Team fragst. Gib ihr einen einzelnen Screenshot, einen ganzen Ablauf über mehrere Screens, eine Figma-Datei, ein Git-Repository oder eine URL, die schon ausgeliefert wird, und sie findet die möglichen Screens, lässt dich auswählen, was angesehen wird, und meldet dann so zurück, wie es erfahrene Designer tun: ein Gesamteindruck, was funktioniert, und die Punkte, die zu schärfen sind, jeder an eine benannte Heuristik gebunden. Abläufe über mehrere Screens erhalten zusätzlich Ergebnisse über Screens hinweg, die ein einzelner Screen nicht zeigen kann — inkonsistente Bedienelemente, fehlender Fortschritt, kein Weg zurück, Sackgassen. Code und Figma werden gerendert, bevor sie beurteilt werden, damit nie Visuelles kritisiert wird, das nicht wirklich gesehen wurde, und sie sagt klar, welche Screens sie nicht erreicht hat, statt zu raten.",
			"display_name": "Design Critique",
			"highlight_1": "Nimmt Screenshots, einen Figma-Link, ein Git-Repository, einen lokalen Ordner oder eine laufende URL — und sagt vor dem Start, was sie gefunden hat",
			"highlight_2": "Misst Kontrast und Größen von Klickzielen an der gerenderten Seite, statt sie aus einem Bild zu schätzen",
			"highlight_3": "Abläufe über mehrere Screens erhalten Prüfungen über Screens hinweg: Konsistenz der Bedienelemente, Fortschritt, ein Weg zurück, wiederholte Abfragen, Sackgassen",
			"highlight_4": "Jedes Ergebnis nennt die dahinterliegende Heuristik (Nielsen 1-10, WCAG, Gestalt, Fitts) und trägt einen Schweregrad auf der NN/g-Skala 1-4",
			"highlight_5": "Markiere eine beliebige Zeile des Berichts und stelle direkt dort eine Folgefrage dazu",
			"highlight_6": "Sagt dir, was sie nicht sehen konnte, statt einen leeren oder blockierten Screen zu kritisieren",
			"highlight_7": "Fasst das geprüfte Projekt nicht an: installiert dessen Abhängigkeiten nie, führt seine Skripte nicht aus, startet seinen Dev-Server nicht und bearbeitet seine Dateien nicht",
			"highlight_8": "Für Aufnahmen nutzt sie einen Headless-Browser, der bei der ersten Verwendung einmalig in einen Cache in deinem Home-Verzeichnis geladen wird, nie in das Projekt",
			"page_label": "Design Critique",
			"use_case_1": "Bewerte einen einzelnen Screen oder einen vollständigen Produktablauf anhand nach Schweregrad sortierter, heuristisch begründeter Ergebnisse, die sichtbaren Bereichen zugeordnet sind.",
			"configuration_1": "Lege Screenshots für eine Prüfung ohne Einrichtung ab oder gib eine Figma-Datei, ein Repository, einen lokalen Ordner oder eine bereits laufende URL an; private GitHub-Quellen können gh auth login erfordern."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Diesen Flow kritisieren · {{count}} Screen",
			"critique_this_flow_count_screens_other": "Diesen Flow kritisieren · {{count}} Screens",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Zum Umsortieren ziehen",
			"move_earlier": "Nach vorne",
			"move_later": "Nach hinten",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Optionaler Kurzbrief: für wen ist es, und was ist die Hauptaufgabe?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Optional: für wen ist es, und was ist die Hauptaufgabe?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Screens",
			"start_over": "Neu beginnen",
			"suggested_flows": "Vorgeschlagene Flows",
			"what_should_i_audit": "Was soll ich prüfen?",
			"screens_found_count_one": "{{n}} Bildschirm gefunden · {{m}} kann ich rendern",
			"screens_found_count_other": "{{n}} Bildschirme gefunden · {{m}} kann ich rendern",
			"flow_n": "Ablauf {{n}}",
			"picked_count_one": "{{n}} ausgewählt",
			"picked_count_other": "{{n}} ausgewählt",
			"hint_order": "Die Zahlen sind die Reihenfolge, in der ich sie durchgehe — zieh eine Zeile zum Umsortieren oder nutze ‹ › auf der Tastatur.",
			"hint_pick": "Klick auf einen Bildschirm, um ihn auszuwählen. Wähle mehrere, um sie als Ablauf zu kritisieren.",
			"cant_render_title": "Den kann ich nicht rendern",
			"cant_render_short": "nicht renderbar",
			"group_fallback": "Bildschirme",
			"tag_from_links": "Aus Links",
			"tag_guess": "Vermutung"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "Ich erfasse sie und messe echten Kontrast und echte Größen.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Ich klone es und liste die Bildschirme auf. Nur Seiten, die ohne Server rendern, sind sichtbar.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Ich liste die Bildschirme auf. Nur Seiten, die ohne Server rendern, sind sichtbar.",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "sie muss gerade laufen. Ich erfasse sie live und messe echten Kontrast und echte Größen.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Das erkenne ich nicht. Gib mir einen Figma-Link, ein GitHub-Repo, einen absoluten lokalen Pfad oder eine URL, die bereits ausgeliefert wird.",
			"screen_fallback": "Bildschirm"
		},
		waitingScreen: {
			"cancel_this_run": "Diesen Lauf abbrechen",
			"stop_this_run_and_discard_it": "Diesen Lauf stoppen und verwerfen",
			"getting_screens_ready": "Die Bildschirme werden vorbereitet…",
			"title_scanning": "Suche nach Bildschirmen zum Prüfen",
			"title_uploading_screens_one": "{{n}} Bildschirm wird hochgeladen…",
			"title_uploading_screens_other": "{{n}} Bildschirme werden hochgeladen…",
			"title_uploading_one": "Dein Screenshot wird hochgeladen…",
			"title_reading_flow_one": "Ich lese deinen Ablauf · {{n}} Bildschirm",
			"title_reading_flow_other": "Ich lese deinen Ablauf · {{n}} Bildschirme",
			"title_reading_screen": "Ich lese deinen Bildschirm",
			"title_getting_pixels": "Zuerst echte Pixel holen",
			"foot_still_going": "Läuft noch — ein dichter Ablauf kann ein paar Minuten dauern. Du kannst die Seite verlassen; die Kritik läuft weiter und ist da, wenn du zurückkommst.",
			"foot_navigate_away": "Du kannst die Seite verlassen — die Kritik läuft weiter."
		},
		common: {
			"send_failed": "Senden fehlgeschlagen",
			"unexpected_server_response": "Unerwartete Serverantwort"
		}
	},
	en: {
		askLayer: {
			"ask": "Ask",
			"ask_about_this": "Ask about this",
			"close": "Close",
			"remove_this_annotation": "Remove this annotation",
			"thinking": "Thinking…",
			"question_label": "Your question about this critique",
			"answer_failed_ask_again_below": "Answer failed — ask again below",
			"ask_a_follow_up": "Ask a follow-up…",
			"ask_again": "Ask again…",
			"what_dont_you_understand_about_this": "What don’t you understand about this?"
		},
		composer: {
			"add_screens": "Add screens",
			"add_screenshots_or_paste_a_link_first": "Add screenshots or paste a link first",
			"clear_all": "Clear all",
			"critique_this_flow_count_screens_one": "Critique this flow · {{count}} screen",
			"critique_this_flow_count_screens_other": "Critique this flow · {{count}} screens",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Drop screenshots — or click to browse",
			"fix_my_access": "Fix my access",
			"fix_the_link": "Fix the link",
			"hide_access_steps": "Hide access steps",
			"move_earlier": "Move earlier",
			"move_later": "Move later",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "one screen, or several in order for a flow · PNG, JPG, WebP",
			"remove": "Remove",
			"remove_name": "Remove {{name}}",
			"send_screenshots": "Send screenshots",
			"start_the_critique": "Start the critique",
			"step_n": "Step {{n}}",
			"try_again": "Try again",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Use a local folder instead",
			"start_kind_figma": "Critique Figma file",
			"start_kind_repo": "Critique repo",
			"start_kind_local": "Critique local code",
			"start_kind_url": "Critique running app",
			"start_this": "Critique this",
			"start_plain": "Critique",
			"staged_one_hint": "1 screen · add another to critique it as a flow.",
			"staged_flow_hint_one": "{{n}} screen · this order is the flow order — reorder or remove before you start.",
			"staged_flow_hint_other": "{{n}} screens · this order is the flow order — reorder or remove before you start.",
			"title_blocked": "I couldn’t get in",
			"title_ask": "What should I critique?",
			"link_placeholder_staged": "Using your screenshots — clear them to critique a link instead",
			"link_placeholder": "Figma link · git repo · a folder on this machine · a running URL (localhost or a deployed preview)",
			"link_label": "Link to critique",
			"render_before_judging": "I render everything before judging it — never from code alone. If your app is already running, paste its URL and I can measure real colours and sizes instead of estimating them."
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "A critique is still running — click to watch it",
			"across_the_flow": "Across the flow",
			"click_to_enlarge": "Click to enlarge",
			"close_esc": "Close (Esc)",
			"couldn_t_see": "Couldn’t see",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "I couldn’t tell what that is. Give me a Figma link, a GitHub/GitLab/Bitbucket repo, an absolute local path, or a URL that’s already serving.",
			"critique_ready": "critique ready",
			"critique_untitled": "Critique",
			"design_critique": "Design Critique",
			"enlarge": "Enlarge",
			"full_size": "full size",
			"full_size_view": "Full size view",
			"history_count": "History ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "I got in, but there’s nothing in there I can render. Drop screenshots instead.",
			"new": "New",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "No screens to show — the critic couldn’t get pixels for this one. See \"Couldn’t see\" in the panel.",
			"nothing_major": "nothing major",
			"numbered_pins_mark_issues_on_this_screen": "numbered pins mark issues on this screen",
			"on_screen": "● on screen",
			"only_added_the_first_room_the_limit_is_max_screens": "Only added the first {{room}} — the limit is {{max}} screens.",
			"pick_a_step_above": "pick a step above",
			"point_me_at_a_running_url": "Point me at a running URL",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Point me at a screen — or a whole flow — and I’ll read it the way a designer friend would: what’s working, what to tighten, and why.",
			"running": "running",
			"screen_heading": "Screen",
			"screens_in_order": "Screens in order",
			"see_an_example": "See an example",
			"send_screenshots": "Send screenshots",
			"show_this_screen": "Show this screen",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Start a new critique — anything already running keeps going",
			"step_n": "Step {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "Switch critique",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "That’s the limit of {{max}} screens.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "What I'd tighten",
			"what_s_working": "What’s working",
			"what_you_ll_get": "What you’ll get",
			"your_critiques": "Your critiques",
			"your_question_click_to_see_the_answer": "Your question — click to see the answer",
			"rail_uploading": "Uploading…",
			"rail_reading": "Reading your design…",
			"rail_flow_one": "A flow of {{n}} screen — I’ll also check the jumps between them.",
			"rail_flow_other": "A flow of {{n}} screens — I’ll also check the jumps between them.",
			"rail_one_screen": "One screen.",
			"rail_pending_figma": "A Figma file — rendering it before judging it.",
			"rail_pending_repo": "A repo — rendering it before judging it.",
			"rail_pending_local": "Local code — rendering it before judging it.",
			"rail_pending_url": "A running app — rendering it before judging it.",
			"rail_pending_design": "A design — rendering it before judging it.",
			"rail_getting_ready": "Getting the screens ready.",
			"critique_ready_fallback": "Critique ready",
			"ask_too_long": "That took too long — ask again.",
			"ask_went_wrong": "Something went wrong.",
			"entry_meta_screens_one": "{{n}} screen · {{when}}",
			"entry_meta_screens_other": "{{n}} screens · {{when}}",
			"findings_count_one": "{{n}} finding",
			"findings_count_other": "{{n}} findings",
			"nothing_flagged": "nothing flagged",
			"design_critique_fallback": "Design critique",
			"flow_screens_count_one": "{{n}} screen",
			"flow_screens_count_other": "{{n}} screens",
			"screen_n": "Screen {{n}}",
			"get_overall_read": "An overall read of how it’s doing",
			"get_whats_working": "What’s working, so it survives the next pass",
			"get_top_things": "The top things to tighten, with pins on the screen",
			"no_critiques_narrow": "No critiques yet. Drop a screenshot below.",
			"no_critiques_wide": "No critiques yet. Drop a screenshot in the panel →",
			"the_design_alt": "The design"
		},
		findingRow: {
			"based_on": "Based on",
			"finding": "Finding",
			"fix": "Fix",
			"suggestion": "Suggestion",
			"what_i_saw": "What I saw",
			"where": "Where",
			"steps_range": "steps {{range}}",
			"flow_badge": "flow"
		},
		manifest: {
			"description": "A design critique you can run before you ask a colleague. Give it one screenshot, a whole multi-screen flow, a Figma file, a git repo, or a URL that is already serving, and it finds the candidate screens, lets you choose what to look at, then reports back the way an experienced designer would: an overall read, what is working, and the things worth tightening, each tied to a named heuristic. Multi-screen flows also get cross-screen findings that a single screen cannot show — inconsistent controls, missing progress, no way back, dead ends. It renders code and Figma before judging them, so it never critiques visuals it has not actually seen, and it says plainly which screens it could not get to instead of guessing.",
			"display_name": "Design Critique",
			"highlight_1": "Takes screenshots, a Figma link, a git repo, a local folder, or a running URL — and says back what it found before it starts",
			"highlight_2": "Measures contrast and hit-target sizes from the rendered page rather than estimating them from an image",
			"highlight_3": "Multi-screen flows get cross-screen checks: control consistency, progress, a way back, repeated asks, dead ends",
			"highlight_4": "Every finding names the heuristic behind it (Nielsen 1-10, WCAG, Gestalt, Fitts) and carries a severity on the NN/g 1-4 scale",
			"highlight_5": "Select any line of the report and ask a follow-up question about it, in place",
			"highlight_6": "Tells you what it could not see instead of critiquing a blank or blocked screen",
			"highlight_7": "Hands off the work it reviews: it never installs that project's dependencies, runs its scripts, starts its dev server, or edits its files",
			"highlight_8": "To take pictures it uses a headless browser, downloaded once into a cache in your home directory on first use and never into the project",
			"page_label": "Design Critique",
			"use_case_1": "Critique one screen or a complete product flow with severity-ranked, heuristic-backed findings tied to visible regions.",
			"configuration_1": "Drop in screenshots for zero-setup review, or provide a Figma file, repository, local folder, or already-running URL; private GitHub sources may require gh auth login."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Critique this flow · {{count}} screen",
			"critique_this_flow_count_screens_other": "Critique this flow · {{count}} screens",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Drag to reorder",
			"move_earlier": "Move earlier",
			"move_later": "Move later",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Optional brief: who is it for, and what is the main task?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Optional: who is it for, and what’s the main task?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Screens",
			"start_over": "Start over",
			"suggested_flows": "Suggested flows",
			"what_should_i_audit": "What should I audit?",
			"screens_found_count_one": "{{n}} screen found · {{m}} I can render",
			"screens_found_count_other": "{{n}} screens found · {{m}} I can render",
			"flow_n": "Flow {{n}}",
			"picked_count_one": "{{n}} picked",
			"picked_count_other": "{{n}} picked",
			"hint_order": "Numbers are the order I’ll walk them — drag a row to reorder, or use ‹ › from the keyboard.",
			"hint_pick": "Click a screen to pick it. Pick several to critique them as a flow.",
			"cant_render_title": "I can’t render this one",
			"cant_render_short": "can’t render",
			"group_fallback": "Screens",
			"tag_from_links": "From links",
			"tag_guess": "Guess"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "I’ll capture it and measure real contrast and sizes.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "I’ll clone it and list the screens. Only pages that render without a server can be seen.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "I’ll list the screens. Only pages that render without a server can be seen.",
			"i_ll_pull_the_frames": "export the frames as PNGs and drop them in — I critique the exported images.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "it must be running right now. I’ll capture it live and measure real contrast and sizes.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Not something I recognise. Give me a Figma link, a GitHub repo, an absolute local path, or a URL that’s already serving.",
			"screen_fallback": "Screen"
		},
		waitingScreen: {
			"cancel_this_run": "Cancel this run",
			"stop_this_run_and_discard_it": "Stop this run and discard it",
			"getting_screens_ready": "Getting the screens ready…",
			"title_scanning": "Looking for screens to audit",
			"title_uploading_screens_one": "Uploading {{n}} screen…",
			"title_uploading_screens_other": "Uploading {{n}} screens…",
			"title_uploading_one": "Uploading your screenshot…",
			"title_reading_flow_one": "Reading your flow · {{n}} screen",
			"title_reading_flow_other": "Reading your flow · {{n}} screens",
			"title_reading_screen": "Reading your screen",
			"title_getting_pixels": "Getting real pixels first",
			"foot_still_going": "Still going — a dense flow can take a couple of minutes. You can navigate away; the critique keeps running and will be here when you come back.",
			"foot_navigate_away": "You can navigate away — the critique keeps running."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Open the file in Figma desktop and try again, or export the frames as PNGs and drop them here.",
			"blocked_figma_app_missing_say": "I can’t reach Figma — the desktop app isn’t running, or I don’t have the Figma tools available.",
			"blocked_figma_export_needed_hint": "Export each frame as a PNG and drop them in as screenshots — I critique the pixels either way.",
			"blocked_figma_export_needed_say": "I can’t pull frames straight from a Figma link here — I don’t run the Figma desktop tools.",
			"blocked_figma_file_closed_hint": "Open it in Figma desktop, then try again.",
			"blocked_figma_file_closed_say": "Figma is running, but that file isn’t open.",
			"blocked_figma_no_permission_auth_lead": "Figma access is per account, and I read whatever the desktop app has open — I have no login of my own. Here is how to fix it.",
			"blocked_figma_no_permission_auth_step_1": "1. Ask the file owner to share it with your Figma account",
			"blocked_figma_no_permission_auth_step_2": "2. Open it in Figma desktop",
			"blocked_figma_no_permission_auth_step_3": "3. Come back and press Try again",
			"blocked_figma_no_permission_auth_tail": "If access isn’t coming, exporting the frames as PNGs works just as well — I critique pixels either way.",
			"blocked_figma_no_permission_hint": "Ask for access, or export the frames as PNGs and drop them here.",
			"blocked_figma_no_permission_say": "Your Figma account can’t view that file.",
			"blocked_no_access_hint": "If you have it checked out, give me the folder path instead.",
			"blocked_no_access_say": "I couldn’t open that repo. It’s either private (and I have no credentials for it) or it doesn’t exist — GitHub returns the same error for both.",
			"blocked_not_found_hint": "Check the owner and name, or give me a local folder path.",
			"blocked_not_found_say": "That repo doesn’t exist at that URL.",
			"blocked_other_hint": "Screenshots are the quickest way around it.",
			"blocked_other_say": "I couldn’t get into that.",
			"kind_figma": "Figma file",
			"kind_local": "local code",
			"kind_repo": "repo",
			"kind_url": "running app",
			"scan_finding_screens": "Finding the screens",
			"scan_grouping_flows": "Grouping them into likely flows",
			"scan_which_renderable": "Working out which ones I can render",
			"sev_catastrophe": "Catastrophe",
			"sev_cosmetic": "Cosmetic",
			"sev_major": "Major",
			"sev_minor": "Minor",
			"stage_checking_hierarchy": "Checking hierarchy, contrast, and content",
			"stage_double_checking": "Double-checking each finding",
			"stage_getting_pixels": "Getting real pixels to look at",
			"stage_reading_screens": "Reading the screens",
			"stage_weighing_task": "Weighing it against the task",
			"stage_writing_up": "Writing up the critique",
			"wait_figma": "Opening the Figma file and listing its frames…",
			"wait_local": "Scanning the code for routes…",
			"wait_repo": "Cloning the repo and listing its routes…",
			"wait_url": "Loading the page and following its links…"
		},
		common: {
			"send_failed": "Send failed",
			"unexpected_server_response": "Unexpected server response"
		}
	},
	es: {
		askLayer: {
			"answer_failed_ask_again_below": "La respuesta falló — vuelve a preguntar abajo",
			"ask_a_follow_up": "Haz otra pregunta…",
			"ask_again": "Vuelve a preguntar…",
			"what_dont_you_understand_about_this": "¿Qué no entiendes de esto?",
			"ask": "Preguntar",
			"ask_about_this": "Preguntar sobre esto",
			"close": "Cerrar",
			"remove_this_annotation": "Eliminar esta anotación",
			"thinking": "Pensando…",
			"question_label": "Tu pregunta sobre esta crítica"
		},
		composer: {
			"add_screens": "Añadir pantallas",
			"add_screenshots_or_paste_a_link_first": "Primero añade capturas o pega un enlace",
			"clear_all": "Borrar todo",
			"critique_this_flow_count_screens_one": "Criticar este flujo · {{count}} pantalla",
			"critique_this_flow_count_screens_many": "Criticar este flujo · {{count}} pantallas",
			"critique_this_flow_count_screens_other": "Criticar este flujo · {{count}} pantallas",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Suelta capturas — o haz clic para explorar",
			"fix_my_access": "Arreglar mi acceso",
			"fix_the_link": "Corregir el enlace",
			"hide_access_steps": "Ocultar los pasos de acceso",
			"move_earlier": "Mover antes",
			"move_later": "Mover después",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "una pantalla, o varias en orden para un flujo · PNG, JPG, WebP",
			"remove": "Eliminar",
			"remove_name": "Eliminar {{name}}",
			"send_screenshots": "Enviar capturas",
			"start_the_critique": "Empezar la crítica",
			"step_n": "Paso {{n}}",
			"try_again": "Reintentar",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Usar una carpeta local en su lugar",
			"start_kind_figma": "Criticar el archivo de Figma",
			"start_kind_repo": "Criticar el repositorio",
			"start_kind_local": "Criticar el código local",
			"start_kind_url": "Criticar la app en ejecución",
			"start_this": "Criticar esto",
			"start_plain": "Criticar",
			"staged_one_hint": "1 pantalla · añade otra para criticarlas como un flujo.",
			"staged_flow_hint_one": "{{n}} pantalla · este orden es el orden del flujo: reordena o quita antes de empezar.",
			"staged_flow_hint_many": "{{n}} pantallas · este orden es el orden del flujo: reordena o quita antes de empezar.",
			"staged_flow_hint_other": "{{n}} pantallas · este orden es el orden del flujo: reordena o quita antes de empezar.",
			"title_blocked": "No pude entrar",
			"title_ask": "¿Qué debo criticar?",
			"link_placeholder_staged": "Usando tus capturas: quítalas para criticar un enlace en su lugar",
			"link_placeholder": "Enlace de Figma · repositorio git · una carpeta de este equipo · una URL en ejecución (localhost o una vista previa desplegada)",
			"link_label": "Enlace para criticar",
			"render_before_judging": "Renderizo todo antes de juzgarlo, nunca solo a partir del código. Si tu app ya se está ejecutando, pega su URL y podré medir colores y tamaños reales en lugar de estimarlos."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Abre el archivo en Figma para escritorio y vuelve a intentarlo, o exporta los marcos como PNG y suéltalos aquí.",
			"blocked_figma_app_missing_say": "No consigo acceder a Figma — la aplicación de escritorio no está en ejecución, o no tengo disponibles las herramientas de Figma.",
			"blocked_figma_export_needed_hint": "Exporta cada frame como PNG y suéltalos aquí como capturas — de todas formas yo critico los píxeles.",
			"blocked_figma_export_needed_say": "No puedo sacar los frames directamente de un enlace de Figma aquí — no tengo las herramientas de escritorio de Figma.",
			"blocked_figma_file_closed_hint": "Ábrelo en Figma para escritorio y vuelve a intentarlo.",
			"blocked_figma_file_closed_say": "Figma está en ejecución, pero ese archivo no está abierto.",
			"blocked_figma_no_permission_auth_lead": "El acceso a Figma es por cuenta, y yo leo lo que tenga abierto la aplicación de escritorio — no tengo un inicio de sesión propio. Así se soluciona.",
			"blocked_figma_no_permission_auth_step_1": "1. Pide al propietario del archivo que lo comparta con tu cuenta de Figma",
			"blocked_figma_no_permission_auth_step_2": "2. Ábrelo en Figma para escritorio",
			"blocked_figma_no_permission_auth_step_3": "3. Vuelve aquí y pulsa Reintentar",
			"blocked_figma_no_permission_auth_tail": "Si no llega el acceso, exportar los marcos como PNG funciona igual de bien — de todos modos yo critico píxeles.",
			"blocked_figma_no_permission_hint": "Pide acceso, o exporta los marcos como PNG y suéltalos aquí.",
			"blocked_figma_no_permission_say": "Tu cuenta de Figma no puede ver ese archivo.",
			"blocked_no_access_hint": "Si ya lo tienes descargado, dame mejor la ruta de la carpeta.",
			"blocked_no_access_say": "No pude abrir ese repo. O es privado (y no tengo credenciales para él) o no existe — GitHub devuelve el mismo error en ambos casos.",
			"blocked_not_found_hint": "Comprueba el propietario y el nombre, o dame la ruta de una carpeta local.",
			"blocked_not_found_say": "Ese repo no existe en esa URL.",
			"blocked_other_hint": "Las capturas de pantalla son la vía más rápida para sortearlo.",
			"blocked_other_say": "No pude acceder a eso.",
			"kind_figma": "archivo de Figma",
			"kind_local": "código local",
			"kind_repo": "repo",
			"kind_url": "aplicación en ejecución",
			"scan_finding_screens": "Buscando las pantallas",
			"scan_grouping_flows": "Agrupándolas en flujos probables",
			"scan_which_renderable": "Averiguando cuáles puedo renderizar",
			"sev_catastrophe": "Catástrofe",
			"sev_cosmetic": "Cosmético",
			"sev_major": "Grave",
			"sev_minor": "Leve",
			"stage_checking_hierarchy": "Comprobando la jerarquía, el contraste y el contenido",
			"stage_double_checking": "Verificando cada hallazgo",
			"stage_getting_pixels": "Obteniendo píxeles reales que mirar",
			"stage_reading_screens": "Leyendo las pantallas",
			"stage_weighing_task": "Contrastándolo con la tarea",
			"stage_writing_up": "Redactando la crítica",
			"wait_figma": "Abriendo el archivo de Figma y enumerando sus marcos…",
			"wait_local": "Analizando el código en busca de rutas…",
			"wait_repo": "Clonando el repo y enumerando sus rutas…",
			"wait_url": "Cargando la página y siguiendo sus enlaces…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Una crítica sigue en marcha — haz clic para verla",
			"across_the_flow": "En todo el flujo",
			"click_to_enlarge": "Haz clic para ampliar",
			"close_esc": "Cerrar (Esc)",
			"couldn_t_see": "No se pudo ver",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "No pude reconocer qué es eso. Dame un enlace de Figma, un repositorio de GitHub/GitLab/Bitbucket, una ruta local absoluta o una URL que ya esté sirviendo.",
			"critique_ready": "crítica lista",
			"critique_untitled": "Crítica",
			"design_critique": "Design Critique",
			"enlarge": "Ampliar",
			"full_size": "tamaño completo",
			"full_size_view": "Vista a tamaño completo",
			"history_count": "Historial ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Entré, pero ahí dentro no hay nada que pueda renderizar. Mejor suéltame capturas de pantalla.",
			"new": "Nueva",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "No hay pantallas que mostrar — el crítico no pudo obtener los píxeles de esta. Consulta \"No se pudo ver\" en el panel.",
			"nothing_major": "nada grave",
			"numbered_pins_mark_issues_on_this_screen": "los pines numerados marcan problemas en esta pantalla",
			"on_screen": "● en pantalla",
			"only_added_the_first_room_the_limit_is_max_screens": "Solo se añadieron las primeras {{room}} — el límite es de {{max}} pantallas.",
			"pick_a_step_above": "elige un paso arriba",
			"point_me_at_a_running_url": "Indícame una URL en ejecución",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Muéstrame una pantalla — o un flujo completo — y lo leeré como lo haría un colega diseñador: qué funciona, qué conviene ajustar y por qué.",
			"running": "en ejecución",
			"screen_heading": "Pantalla",
			"screens_in_order": "Pantallas en orden",
			"see_an_example": "Ver un ejemplo",
			"send_screenshots": "Enviar capturas",
			"show_this_screen": "Mostrar esta pantalla",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Inicia una nueva crítica — lo que ya esté en marcha continúa",
			"step_n": "Paso {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Sigo trabajando en esto. Continúa en ejecución — vuelve en un minuto.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Sigo trabajando en esto. Continúa en ejecución — vuelve a esta página en un minuto y retomará donde lo dejó.",
			"switch_critique": "Cambiar de crítica",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "Son más de 20 pantallas — envía menos.",
			"that_s_the_limit_of_max_screens": "Ese es el límite de {{max}} pantallas.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "Qué ajustaría",
			"what_s_working": "Qué funciona",
			"what_you_ll_get": "Qué obtendrás",
			"your_critiques": "Tus críticas",
			"your_question_click_to_see_the_answer": "Tu pregunta — haz clic para ver la respuesta",
			"rail_uploading": "Subiendo…",
			"rail_reading": "Leyendo tu diseño…",
			"rail_flow_one": "Un flujo de {{n}} pantalla: también revisaré los saltos entre ellas.",
			"rail_flow_many": "Un flujo de {{n}} pantallas: también revisaré los saltos entre ellas.",
			"rail_flow_other": "Un flujo de {{n}} pantallas: también revisaré los saltos entre ellas.",
			"rail_one_screen": "Una pantalla.",
			"rail_pending_figma": "Un archivo de Figma: lo renderizo antes de juzgarlo.",
			"rail_pending_repo": "Un repositorio: lo renderizo antes de juzgarlo.",
			"rail_pending_local": "Código local: lo renderizo antes de juzgarlo.",
			"rail_pending_url": "Una app en ejecución: la renderizo antes de juzgarla.",
			"rail_pending_design": "Un diseño: lo renderizo antes de juzgarlo.",
			"rail_getting_ready": "Preparando las pantallas.",
			"critique_ready_fallback": "Crítica lista",
			"ask_too_long": "Tardó demasiado: vuelve a preguntar.",
			"ask_went_wrong": "Algo salió mal.",
			"entry_meta_screens_one": "{{n}} pantalla · {{when}}",
			"entry_meta_screens_many": "{{n}} pantallas · {{when}}",
			"entry_meta_screens_other": "{{n}} pantallas · {{when}}",
			"findings_count_one": "{{n}} hallazgo",
			"findings_count_many": "{{n}} hallazgos",
			"findings_count_other": "{{n}} hallazgos",
			"nothing_flagged": "nada señalado",
			"design_critique_fallback": "Crítica de diseño",
			"flow_screens_count_one": "{{n}} pantalla",
			"flow_screens_count_many": "{{n}} pantallas",
			"flow_screens_count_other": "{{n}} pantallas",
			"screen_n": "Pantalla {{n}}",
			"get_overall_read": "Una valoración general de cómo va",
			"get_whats_working": "Lo que funciona, para que sobreviva a la siguiente pasada",
			"get_top_things": "Lo más importante que ajustar, con marcas en la pantalla",
			"no_critiques_narrow": "Aún no hay críticas. Suelta una captura abajo.",
			"no_critiques_wide": "Aún no hay críticas. Suelta una captura en el panel →",
			"the_design_alt": "El diseño"
		},
		findingRow: {
			"based_on": "Basado en",
			"finding": "Hallazgo",
			"fix": "Corrección",
			"suggestion": "Sugerencia",
			"what_i_saw": "Qué vi",
			"where": "Dónde",
			"steps_range": "pasos {{range}}",
			"flow_badge": "flujo"
		},
		manifest: {
			"description": "Una crítica de diseño que puedes ejecutar antes de pedírsela a un colega. Le das una captura, un flujo completo de varias pantallas, un archivo de Figma, un repositorio git o una URL que ya esté sirviendo, y encuentra las pantallas candidatas, te deja elegir qué revisar y luego responde como lo haría un diseñador con experiencia: una lectura general, lo que funciona y lo que vale la pena ajustar, cada punto ligado a una heurística con nombre. Los flujos de varias pantallas también reciben hallazgos entre pantallas que una sola no puede mostrar — controles inconsistentes, falta de indicación de avance, ninguna forma de volver, callejones sin salida. Renderiza el código y Figma antes de juzgarlos, así que nunca critica elementos visuales que no vio de verdad, y dice con claridad a qué pantallas no pudo llegar en lugar de adivinar.",
			"display_name": "Design Critique",
			"highlight_1": "Acepta capturas, un enlace de Figma, un repositorio git, una carpeta local o una URL en ejecución — y te dice qué encontró antes de empezar",
			"highlight_2": "Mide el contraste y el tamaño de las áreas táctiles desde la página renderizada en vez de estimarlos a partir de una imagen",
			"highlight_3": "Los flujos de varias pantallas reciben comprobaciones entre pantallas: consistencia de los controles, indicación de avance, una forma de volver, peticiones repetidas y callejones sin salida",
			"highlight_4": "Cada hallazgo nombra la heurística en la que se basa (Nielsen 1-10, WCAG, Gestalt, Fitts) y lleva una severidad en la escala 1-4 de NN/g",
			"highlight_5": "Selecciona cualquier línea del informe y haz una pregunta de seguimiento sobre ella, ahí mismo",
			"highlight_6": "Te dice qué no pudo ver en lugar de criticar una pantalla vacía o bloqueada",
			"highlight_7": "No toca el proyecto que revisa: nunca instala sus dependencias, ejecuta sus scripts, inicia su servidor de desarrollo ni edita sus archivos",
			"highlight_8": "Para tomar las capturas usa un navegador headless, que se descarga una vez en una caché de tu directorio home en el primer uso y nunca dentro del proyecto",
			"page_label": "Design Critique",
			"use_case_1": "Evalúa una pantalla o un flujo de producto completo con hallazgos ordenados por gravedad, basados en heurísticas y vinculados a zonas visibles.",
			"configuration_1": "Añade capturas para una revisión sin configuración o proporciona un archivo de Figma, un repositorio, una carpeta local o una URL ya activa; las fuentes privadas de GitHub pueden requerir gh auth login."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Criticar este flujo · {{count}} pantalla",
			"critique_this_flow_count_screens_many": "Criticar este flujo · {{count}} pantallas",
			"critique_this_flow_count_screens_other": "Criticar este flujo · {{count}} pantallas",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Arrastra para reordenar",
			"move_earlier": "Mover antes",
			"move_later": "Mover después",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Resumen opcional: ¿para quién es y cuál es la tarea principal?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Opcional: ¿para quién es y cuál es la tarea principal?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Pantallas",
			"start_over": "Empezar de nuevo",
			"suggested_flows": "Flujos sugeridos",
			"what_should_i_audit": "¿Qué debo revisar?",
			"screens_found_count_one": "{{n}} pantalla encontrada · {{m}} que puedo renderizar",
			"screens_found_count_many": "{{n}} pantallas encontradas · {{m}} que puedo renderizar",
			"screens_found_count_other": "{{n}} pantallas encontradas · {{m}} que puedo renderizar",
			"flow_n": "Flujo {{n}}",
			"picked_count_one": "{{n}} elegida",
			"picked_count_many": "{{n}} elegidas",
			"picked_count_other": "{{n}} elegidas",
			"hint_order": "Los números son el orden en que las recorreré: arrastra una fila para reordenar o usa ‹ › con el teclado.",
			"hint_pick": "Haz clic en una pantalla para elegirla. Elige varias para criticarlas como un flujo.",
			"cant_render_title": "No puedo renderizar esta",
			"cant_render_short": "no se puede renderizar",
			"group_fallback": "Pantallas",
			"tag_from_links": "Según enlaces",
			"tag_guess": "Suposición"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "Lo capturaré y mediré el contraste y los tamaños reales.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Lo clonaré y listaré las pantallas. Solo se pueden ver las páginas que se renderizan sin un servidor.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Listaré las pantallas. Solo se pueden ver las páginas que se renderizan sin un servidor.",
			"i_ll_pull_the_frames": "Traeré los frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "debe estar en ejecución ahora mismo. Lo capturaré en vivo y mediré el contraste y los tamaños reales.",
			"not_something_i_recognise_give_me_a_figma_link_a": "No lo reconozco. Envíame un enlace de Figma, un repositorio de GitHub, una ruta local absoluta o una URL que ya esté en servicio.",
			"screen_fallback": "Pantalla"
		},
		waitingScreen: {
			"cancel_this_run": "Cancelar esta ejecución",
			"stop_this_run_and_discard_it": "Detener esta ejecución y descartarla",
			"getting_screens_ready": "Preparando las pantallas…",
			"title_scanning": "Buscando pantallas para revisar",
			"title_uploading_screens_one": "Subiendo {{n}} pantalla…",
			"title_uploading_screens_many": "Subiendo {{n}} pantallas…",
			"title_uploading_screens_other": "Subiendo {{n}} pantallas…",
			"title_uploading_one": "Subiendo tu captura…",
			"title_reading_flow_one": "Leyendo tu flujo · {{n}} pantalla",
			"title_reading_flow_many": "Leyendo tu flujo · {{n}} pantallas",
			"title_reading_flow_other": "Leyendo tu flujo · {{n}} pantallas",
			"title_reading_screen": "Leyendo tu pantalla",
			"title_getting_pixels": "Primero obtengo píxeles reales",
			"foot_still_going": "Sigue en marcha: un flujo denso puede tardar un par de minutos. Puedes salir de aquí; la crítica sigue y estará lista cuando vuelvas.",
			"foot_navigate_away": "Puedes salir de aquí: la crítica sigue en marcha."
		},
		common: {
			"send_failed": "Error al enviar",
			"unexpected_server_response": "Respuesta inesperada del servidor"
		}
	},
	fr: {
		askLayer: {
			"answer_failed_ask_again_below": "La réponse a échoué — repose ta question ci-dessous",
			"ask_a_follow_up": "Pose une autre question…",
			"ask_again": "Repose ta question…",
			"what_dont_you_understand_about_this": "Qu’est-ce que tu ne comprends pas ici ?",
			"ask": "Demander",
			"ask_about_this": "Poser une question",
			"close": "Fermer",
			"remove_this_annotation": "Supprimer cette annotation",
			"thinking": "Réflexion…",
			"question_label": "Ta question sur cette critique"
		},
		composer: {
			"add_screens": "Ajouter des écrans",
			"add_screenshots_or_paste_a_link_first": "Ajoute d’abord des captures ou colle un lien",
			"clear_all": "Tout effacer",
			"critique_this_flow_count_screens_one": "Critiquer ce parcours · {{count}} écran",
			"critique_this_flow_count_screens_many": "Critiquer ce parcours · {{count}} écrans",
			"critique_this_flow_count_screens_other": "Critiquer ce parcours · {{count}} écrans",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Déposez des captures — ou cliquez pour parcourir",
			"fix_my_access": "Réparer mon accès",
			"fix_the_link": "Corriger le lien",
			"hide_access_steps": "Masquer les étapes d’accès",
			"move_earlier": "Déplacer avant",
			"move_later": "Déplacer après",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "un écran, ou plusieurs dans l'ordre pour un parcours · PNG, JPG, WebP",
			"remove": "Supprimer",
			"remove_name": "Supprimer {{name}}",
			"send_screenshots": "Envoyer les captures",
			"start_the_critique": "Lancer la critique",
			"step_n": "Étape {{n}}",
			"try_again": "Réessayer",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Utiliser plutôt un dossier local",
			"start_kind_figma": "Critiquer le fichier Figma",
			"start_kind_repo": "Critiquer le dépôt",
			"start_kind_local": "Critiquer le code local",
			"start_kind_url": "Critiquer l’app en cours d’exécution",
			"start_this": "Critiquer ceci",
			"start_plain": "Critiquer",
			"staged_one_hint": "1 écran · ajoute-en un autre pour les critiquer comme un parcours.",
			"staged_flow_hint_one": "{{n}} écran · cet ordre est celui du parcours — réordonne ou retire avant de commencer.",
			"staged_flow_hint_many": "{{n}} écrans · cet ordre est celui du parcours — réordonne ou retire avant de commencer.",
			"staged_flow_hint_other": "{{n}} écrans · cet ordre est celui du parcours — réordonne ou retire avant de commencer.",
			"title_blocked": "Je n’ai pas pu entrer",
			"title_ask": "Que dois-je critiquer ?",
			"link_placeholder_staged": "Tes captures sont utilisées — retire-les pour critiquer un lien à la place",
			"link_placeholder": "Lien Figma · dépôt git · un dossier sur cette machine · une URL en cours d’exécution (localhost ou un aperçu déployé)",
			"link_label": "Lien à critiquer",
			"render_before_judging": "J’affiche tout avant de juger — jamais à partir du code seul. Si ton app tourne déjà, colle son URL et je pourrai mesurer les vraies couleurs et tailles au lieu de les estimer."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Ouvre le fichier dans l’application de bureau Figma et réessaie, ou exporte les cadres en PNG et dépose-les ici.",
			"blocked_figma_app_missing_say": "Je n’arrive pas à joindre Figma — l’application de bureau n’est pas lancée, ou les outils Figma ne sont pas disponibles.",
			"blocked_figma_export_needed_hint": "Exporte chaque frame en PNG et dépose-les ici comme captures — de toute façon, je critique les pixels.",
			"blocked_figma_export_needed_say": "Je ne peux pas récupérer les frames directement depuis un lien Figma ici — je n’ai pas les outils Figma de bureau.",
			"blocked_figma_file_closed_hint": "Ouvre-le dans l’application de bureau Figma, puis réessaie.",
			"blocked_figma_file_closed_say": "Figma est lancé, mais ce fichier n’est pas ouvert.",
			"blocked_figma_no_permission_auth_lead": "L’accès à Figma est propre à chaque compte, et je lis ce que l’application de bureau a ouvert — je n’ai pas d’identifiants à moi. Voici comment corriger cela.",
			"blocked_figma_no_permission_auth_step_1": "1. Demande au propriétaire du fichier de le partager avec ton compte Figma",
			"blocked_figma_no_permission_auth_step_2": "2. Ouvre-le dans l’application de bureau Figma",
			"blocked_figma_no_permission_auth_step_3": "3. Reviens et appuie sur Réessayer",
			"blocked_figma_no_permission_auth_tail": "Si l’accès n’arrive pas, exporter les cadres en PNG fonctionne tout aussi bien — je critique les pixels dans les deux cas.",
			"blocked_figma_no_permission_hint": "Demande l’accès, ou exporte les cadres en PNG et dépose-les ici.",
			"blocked_figma_no_permission_say": "Ton compte Figma ne peut pas consulter ce fichier.",
			"blocked_no_access_hint": "Si tu l’as déjà récupéré en local, donne-moi plutôt le chemin du dossier.",
			"blocked_no_access_say": "Je n’ai pas pu ouvrir ce dépôt. Soit il est privé (et je n’ai aucun identifiant pour lui), soit il n’existe pas — GitHub renvoie la même erreur dans les deux cas.",
			"blocked_not_found_hint": "Vérifie le propriétaire et le nom, ou donne-moi le chemin d’un dossier local.",
			"blocked_not_found_say": "Ce dépôt n’existe pas à cette URL.",
			"blocked_other_hint": "Les captures d’écran sont le moyen le plus rapide de contourner le problème.",
			"blocked_other_say": "Je n’ai pas pu y accéder.",
			"kind_figma": "fichier Figma",
			"kind_local": "code local",
			"kind_repo": "dépôt",
			"kind_url": "application en cours d’exécution",
			"scan_finding_screens": "Recherche des écrans",
			"scan_grouping_flows": "Regroupement en parcours probables",
			"scan_which_renderable": "Détermination de ceux que je peux afficher",
			"sev_catastrophe": "Catastrophe",
			"sev_cosmetic": "Cosmétique",
			"sev_major": "Majeur",
			"sev_minor": "Mineur",
			"stage_checking_hierarchy": "Vérification de la hiérarchie, du contraste et du contenu",
			"stage_double_checking": "Double vérification de chaque conclusion",
			"stage_getting_pixels": "Récupération de vrais pixels à examiner",
			"stage_reading_screens": "Lecture des écrans",
			"stage_weighing_task": "Mise en balance avec la tâche",
			"stage_writing_up": "Rédaction de la critique",
			"wait_figma": "Ouverture du fichier Figma et liste de ses cadres…",
			"wait_local": "Analyse du code à la recherche des routes…",
			"wait_repo": "Clonage du dépôt et liste de ses routes…",
			"wait_url": "Chargement de la page et suivi de ses liens…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Une critique est encore en cours — cliquez pour la suivre",
			"across_the_flow": "Sur l'ensemble du parcours",
			"click_to_enlarge": "Clique pour agrandir",
			"close_esc": "Fermer (Échap)",
			"couldn_t_see": "Non visible",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "Je n’ai pas reconnu ce que c’est. Donnez-moi un lien Figma, un dépôt GitHub/GitLab/Bitbucket, un chemin local absolu ou une URL déjà en service.",
			"critique_ready": "critique prête",
			"critique_untitled": "Critique",
			"design_critique": "Design Critique",
			"enlarge": "Agrandir",
			"full_size": "taille réelle",
			"full_size_view": "Affichage taille réelle",
			"history_count": "Historique ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Je suis entré, mais il n’y a rien là-dedans que je puisse afficher. Envoie-moi plutôt des captures d’écran.",
			"new": "Nouvelle",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "Aucun écran à afficher — le critique n'a pas pu récupérer les pixels de celui-ci. Voir « Non visible » dans le panneau.",
			"nothing_major": "rien de majeur",
			"numbered_pins_mark_issues_on_this_screen": "les repères numérotés signalent les problèmes de cet écran",
			"on_screen": "● à l'écran",
			"only_added_the_first_room_the_limit_is_max_screens": "Seuls les {{room}} premiers ont été ajoutés — la limite est de {{max}} écrans.",
			"pick_a_step_above": "choisis une étape ci-dessus",
			"point_me_at_a_running_url": "Indiquez-moi une URL active",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Montrez-moi un écran — ou tout un parcours — et je le lirai comme le ferait un ami designer : ce qui fonctionne, ce qu'il faut resserrer, et pourquoi.",
			"running": "en cours",
			"screen_heading": "Écran",
			"screens_in_order": "Écrans dans l’ordre",
			"see_an_example": "Voir un exemple",
			"send_screenshots": "Envoyer les captures",
			"show_this_screen": "Afficher cet écran",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Lancer une nouvelle critique — celles déjà en cours se poursuivent",
			"step_n": "Étape {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "Changer de critique",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "C’est la limite de {{max}} écrans.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "Ce que je resserrerais",
			"what_s_working": "Ce qui fonctionne",
			"what_you_ll_get": "Ce que vous obtiendrez",
			"your_critiques": "Vos critiques",
			"your_question_click_to_see_the_answer": "Votre question — cliquez pour voir la réponse",
			"rail_uploading": "Envoi…",
			"rail_reading": "Lecture de ton design…",
			"rail_flow_one": "Un parcours de {{n}} écran — je vérifierai aussi les transitions entre eux.",
			"rail_flow_many": "Un parcours de {{n}} écrans — je vérifierai aussi les transitions entre eux.",
			"rail_flow_other": "Un parcours de {{n}} écrans — je vérifierai aussi les transitions entre eux.",
			"rail_one_screen": "Un écran.",
			"rail_pending_figma": "Un fichier Figma — je l’affiche avant de le juger.",
			"rail_pending_repo": "Un dépôt — je l’affiche avant de le juger.",
			"rail_pending_local": "Du code local — je l’affiche avant de le juger.",
			"rail_pending_url": "Une app en cours d’exécution — je l’affiche avant de la juger.",
			"rail_pending_design": "Un design — je l’affiche avant de le juger.",
			"rail_getting_ready": "Préparation des écrans.",
			"critique_ready_fallback": "Critique prête",
			"ask_too_long": "C’était trop long — redemande.",
			"ask_went_wrong": "Une erreur s’est produite.",
			"entry_meta_screens_one": "{{n}} écran · {{when}}",
			"entry_meta_screens_many": "{{n}} écrans · {{when}}",
			"entry_meta_screens_other": "{{n}} écrans · {{when}}",
			"findings_count_one": "{{n}} remarque",
			"findings_count_many": "{{n}} remarques",
			"findings_count_other": "{{n}} remarques",
			"nothing_flagged": "rien de signalé",
			"design_critique_fallback": "Critique de design",
			"flow_screens_count_one": "{{n}} écran",
			"flow_screens_count_many": "{{n}} écrans",
			"flow_screens_count_other": "{{n}} écrans",
			"screen_n": "Écran {{n}}",
			"get_overall_read": "Un avis d’ensemble sur où il en est",
			"get_whats_working": "Ce qui fonctionne, pour que ça survive à la prochaine passe",
			"get_top_things": "Les points principaux à resserrer, avec des repères sur l’écran",
			"no_critiques_narrow": "Aucune critique pour l’instant. Dépose une capture ci-dessous.",
			"no_critiques_wide": "Aucune critique pour l’instant. Dépose une capture dans le panneau →",
			"the_design_alt": "Le design"
		},
		findingRow: {
			"based_on": "D'après",
			"finding": "Constat",
			"fix": "Correctif",
			"suggestion": "Suggestion",
			"what_i_saw": "Ce que j'ai vu",
			"where": "Où",
			"steps_range": "étapes {{range}}",
			"flow_badge": "parcours"
		},
		manifest: {
			"description": "Une critique de design que tu peux lancer avant de solliciter un collègue. Donne-lui une capture d’écran, tout un parcours multi-écrans, un fichier Figma, un dépôt git ou une URL déjà servie, et il repère les écrans candidats, te laisse choisir ce qu’il doit examiner, puis rend son compte rendu comme le ferait un designer expérimenté : une lecture d’ensemble, ce qui fonctionne et ce qui mérite d’être resserré, chaque point rattaché à une heuristique nommée. Les parcours multi-écrans reçoivent en plus des conclusions transversales qu’un écran seul ne peut pas révéler — contrôles incohérents, progression absente, aucun retour possible, impasses. Il rend le code et Figma avant de les juger, donc il ne critique jamais un visuel qu’il n’a pas réellement vu, et il dit clairement quels écrans il n’a pas pu atteindre plutôt que de deviner.",
			"display_name": "Design Critique",
			"highlight_1": "Accepte des captures d’écran, un lien Figma, un dépôt git, un dossier local ou une URL en service — et te dit ce qu’il a trouvé avant de commencer",
			"highlight_2": "Mesure le contraste et la taille des zones cliquables sur la page rendue plutôt que de les estimer depuis une image",
			"highlight_3": "Les parcours multi-écrans reçoivent des vérifications transversales : cohérence des contrôles, progression, retour possible, demandes répétées, impasses",
			"highlight_4": "Chaque conclusion nomme l’heuristique qui la fonde (Nielsen 1-10, WCAG, Gestalt, Fitts) et porte une gravité sur l’échelle NN/g 1-4",
			"highlight_5": "Sélectionne n’importe quelle ligne du rapport et pose une question complémentaire à son sujet, sur place",
			"highlight_6": "Te dit ce qu’il n’a pas pu voir plutôt que de critiquer un écran vide ou bloqué",
			"highlight_7": "Ne touche pas au projet qu’il examine : il n’installe jamais ses dépendances, n’exécute pas ses scripts, ne démarre pas son serveur de développement et ne modifie pas ses fichiers",
			"highlight_8": "Pour prendre des images, il utilise un navigateur headless, téléchargé une seule fois dans un cache de ton répertoire personnel à la première utilisation, jamais dans le projet",
			"page_label": "Design Critique",
			"use_case_1": "Évalue un écran ou un parcours produit complet à partir de conclusions classées par gravité, fondées sur des heuristiques et liées aux zones visibles.",
			"configuration_1": "Dépose des captures d'écran pour une analyse sans configuration, ou fournis un fichier Figma, un dépôt, un dossier local ou une URL déjà en ligne ; les sources GitHub privées peuvent nécessiter gh auth login."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Critiquer ce parcours · {{count}} écran",
			"critique_this_flow_count_screens_many": "Critiquer ce parcours · {{count}} écrans",
			"critique_this_flow_count_screens_other": "Critiquer ce parcours · {{count}} écrans",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Glisser pour réorganiser",
			"move_earlier": "Déplacer avant",
			"move_later": "Déplacer après",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Brief facultatif : à qui s'adresse-t-il et quelle est la tâche principale ?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Facultatif : à qui s'adresse-t-il et quelle est la tâche principale ?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Écrans",
			"start_over": "Recommencer",
			"suggested_flows": "Parcours suggérés",
			"what_should_i_audit": "Que dois-je auditer ?",
			"screens_found_count_one": "{{n}} écran trouvé · {{m}} que je peux rendre",
			"screens_found_count_many": "{{n}} écrans trouvés · {{m}} que je peux rendre",
			"screens_found_count_other": "{{n}} écrans trouvés · {{m}} que je peux rendre",
			"flow_n": "Parcours {{n}}",
			"picked_count_one": "{{n}} choisi",
			"picked_count_many": "{{n}} choisis",
			"picked_count_other": "{{n}} choisis",
			"hint_order": "Les numéros sont l’ordre dans lequel je les parcourrai — fais glisser une ligne pour réordonner, ou utilise ‹ › au clavier.",
			"hint_pick": "Clique sur un écran pour le choisir. Choisis-en plusieurs pour les critiquer comme un parcours.",
			"cant_render_title": "Je ne peux pas rendre celui-ci",
			"cant_render_short": "rendu impossible",
			"group_fallback": "Écrans",
			"tag_from_links": "D’après les liens",
			"tag_guess": "Supposition"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "Je vais la capturer et mesurer le contraste et les tailles réels.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Je vais le cloner et lister les écrans. Seules les pages qui s’affichent sans serveur sont visibles.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Je vais lister les écrans. Seules les pages qui s’affichent sans serveur sont visibles.",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "elle doit tourner en ce moment. Je vais la capturer en direct et mesurer le contraste et les tailles réels.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Je ne reconnais pas ça. Donne-moi un lien Figma, un dépôt GitHub, un chemin local absolu ou une URL déjà servie.",
			"screen_fallback": "Écran"
		},
		waitingScreen: {
			"cancel_this_run": "Annuler cette exécution",
			"stop_this_run_and_discard_it": "Arrêter cette exécution et l'abandonner",
			"getting_screens_ready": "Préparation des écrans…",
			"title_scanning": "Recherche d’écrans à auditer",
			"title_uploading_screens_one": "Envoi de {{n}} écran…",
			"title_uploading_screens_many": "Envoi de {{n}} écrans…",
			"title_uploading_screens_other": "Envoi de {{n}} écrans…",
			"title_uploading_one": "Envoi de ta capture…",
			"title_reading_flow_one": "Lecture de ton parcours · {{n}} écran",
			"title_reading_flow_many": "Lecture de ton parcours · {{n}} écrans",
			"title_reading_flow_other": "Lecture de ton parcours · {{n}} écrans",
			"title_reading_screen": "Lecture de ton écran",
			"title_getting_pixels": "D’abord, de vrais pixels",
			"foot_still_going": "Toujours en cours — un parcours dense peut prendre quelques minutes. Tu peux quitter la page ; la critique continue et sera là à ton retour.",
			"foot_navigate_away": "Tu peux quitter la page — la critique continue."
		},
		common: {
			"send_failed": "Échec de l’envoi",
			"unexpected_server_response": "Réponse inattendue du serveur"
		}
	},
	hi: {
		askLayer: {
			"answer_failed_ask_again_below": "जवाब नहीं मिल सका — नीचे फिर से पूछो",
			"ask_a_follow_up": "एक और सवाल पूछो…",
			"ask_again": "फिर से पूछो…",
			"what_dont_you_understand_about_this": "इसमें क्या समझ नहीं आया?",
			"ask": "पूछें",
			"ask_about_this": "इस बारे में पूछें",
			"close": "बंद करें",
			"remove_this_annotation": "यह एनोटेशन हटाएँ",
			"thinking": "सोच रहे हैं…",
			"question_label": "इस समीक्षा के बारे में तुम्हारा सवाल"
		},
		composer: {
			"add_screens": "स्क्रीन जोड़ें",
			"add_screenshots_or_paste_a_link_first": "पहले स्क्रीनशॉट जोड़ो या लिंक चिपकाओ",
			"clear_all": "सभी हटाएँ",
			"critique_this_flow_count_screens_one": "इस फ़्लो की समीक्षा करो · {{count}} स्क्रीन",
			"critique_this_flow_count_screens_other": "इस फ़्लो की समीक्षा करो · {{count}} स्क्रीन",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "स्क्रीनशॉट यहाँ छोड़ें — या ब्राउज़ करने के लिए क्लिक करें",
			"fix_my_access": "मेरी पहुँच ठीक करो",
			"fix_the_link": "लिंक ठीक करें",
			"hide_access_steps": "पहुँच के चरण छिपाओ",
			"move_earlier": "पहले ले जाएँ",
			"move_later": "बाद में ले जाएँ",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "एक स्क्रीन, या फ़्लो के लिए क्रम में कई · PNG, JPG, WebP",
			"remove": "हटाएँ",
			"remove_name": "{{name}} हटाओ",
			"send_screenshots": "स्क्रीनशॉट भेजें",
			"start_the_critique": "समीक्षा शुरू करो",
			"step_n": "चरण {{n}}",
			"try_again": "फिर से कोशिश करें",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "इसके बजाय लोकल फ़ोल्डर इस्तेमाल करें",
			"start_kind_figma": "Figma फ़ाइल की समीक्षा करो",
			"start_kind_repo": "रिपॉज़िटरी की समीक्षा करो",
			"start_kind_local": "स्थानीय कोड की समीक्षा करो",
			"start_kind_url": "चल रहे ऐप की समीक्षा करो",
			"start_this": "इसकी समीक्षा करो",
			"start_plain": "समीक्षा करो",
			"staged_one_hint": "1 स्क्रीन · इसे फ़्लो के रूप में समीक्षा करने के लिए एक और जोड़ो।",
			"staged_flow_hint_one": "{{n}} स्क्रीन · यही क्रम फ़्लो का क्रम है — शुरू करने से पहले क्रम बदलो या हटाओ।",
			"staged_flow_hint_other": "{{n}} स्क्रीन · यही क्रम फ़्लो का क्रम है — शुरू करने से पहले क्रम बदलो या हटाओ।",
			"title_blocked": "मैं अंदर नहीं जा सका",
			"title_ask": "मैं किसकी समीक्षा करूँ?",
			"link_placeholder_staged": "तुम्हारे स्क्रीनशॉट इस्तेमाल हो रहे हैं — लिंक की समीक्षा के लिए उन्हें हटाओ",
			"link_placeholder": "Figma लिंक · git रिपॉज़िटरी · इस मशीन का कोई फ़ोल्डर · कोई चल रहा URL (localhost या तैनात प्रीव्यू)",
			"link_label": "समीक्षा के लिए लिंक",
			"render_before_judging": "मैं आँकने से पहले सब कुछ रेंडर करता हूँ — सिर्फ़ कोड देखकर कभी नहीं। अगर तुम्हारा ऐप पहले से चल रहा है, तो उसका URL चिपकाओ, ताकि मैं अनुमान लगाने के बजाय असली रंग और आकार माप सकूँ।"
		},
		constants: {
			"blocked_figma_app_missing_hint": "फ़ाइल को Figma डेस्कटॉप में खोलें और फिर कोशिश करें, या फ़्रेम को PNG के रूप में एक्सपोर्ट करके यहाँ छोड़ें।",
			"blocked_figma_app_missing_say": "मैं Figma तक नहीं पहुँच पा रहा — डेस्कटॉप ऐप चल नहीं रहा, या मेरे पास Figma टूल उपलब्ध नहीं हैं।",
			"blocked_figma_export_needed_hint": "हर फ्रेम को PNG के रूप में एक्सपोर्ट करें और स्क्रीनशॉट के तौर पर यहाँ छोड़ दें — पिक्सेल तो मैं वैसे भी परखता हूँ।",
			"blocked_figma_export_needed_say": "यहाँ मैं Figma लिंक से सीधे फ्रेम नहीं खींच सकता — मेरे पास Figma डेस्कटॉप टूल नहीं हैं।",
			"blocked_figma_file_closed_hint": "इसे Figma डेस्कटॉप में खोलें, फिर कोशिश करें।",
			"blocked_figma_file_closed_say": "Figma चल रहा है, लेकिन वह फ़ाइल खुली नहीं है।",
			"blocked_figma_no_permission_auth_lead": "Figma का एक्सेस हर अकाउंट के हिसाब से होता है, और डेस्कटॉप ऐप में जो खुला हो मैं वही पढ़ता हूँ — मेरा ख़ुद का कोई लॉगिन नहीं है। इसे ठीक करने का तरीक़ा यह है।",
			"blocked_figma_no_permission_auth_step_1": "1. फ़ाइल के मालिक से इसे अपने Figma अकाउंट के साथ शेयर करने को कहें",
			"blocked_figma_no_permission_auth_step_2": "2. इसे Figma डेस्कटॉप में खोलें",
			"blocked_figma_no_permission_auth_step_3": "3. वापस आएँ और “फिर कोशिश करें” दबाएँ",
			"blocked_figma_no_permission_auth_tail": "अगर एक्सेस नहीं मिल रहा, तो फ़्रेम को PNG के रूप में एक्सपोर्ट करना भी उतना ही काम करता है — मैं दोनों हालत में पिक्सल की ही समीक्षा करता हूँ।",
			"blocked_figma_no_permission_hint": "एक्सेस माँगें, या फ़्रेम को PNG के रूप में एक्सपोर्ट करके यहाँ छोड़ें।",
			"blocked_figma_no_permission_say": "तुम्हारा Figma अकाउंट वह फ़ाइल नहीं देख सकता।",
			"blocked_no_access_hint": "अगर इसे चेकआउट कर रखा है, तो इसके बजाय मुझे फ़ोल्डर का पाथ दें।",
			"blocked_no_access_say": "मैं वह रिपो नहीं खोल सका। यह या तो प्राइवेट है (और मेरे पास इसके क्रेडेंशियल नहीं हैं) या यह मौजूद नहीं है — GitHub दोनों के लिए एक ही त्रुटि देता है।",
			"blocked_not_found_hint": "मालिक और नाम जाँचें, या मुझे कोई स्थानीय फ़ोल्डर पाथ दें।",
			"blocked_not_found_say": "उस URL पर वह रिपो मौजूद नहीं है।",
			"blocked_other_hint": "इससे पार पाने का सबसे तेज़ तरीका स्क्रीनशॉट देना है।",
			"blocked_other_say": "मैं उस तक नहीं पहुँच सका।",
			"kind_figma": "Figma फ़ाइल",
			"kind_local": "स्थानीय कोड",
			"kind_repo": "रिपो",
			"kind_url": "चल रहा ऐप",
			"scan_finding_screens": "स्क्रीन खोज रहा हूँ",
			"scan_grouping_flows": "उन्हें संभावित फ़्लो में समूहबद्ध कर रहा हूँ",
			"scan_which_renderable": "पता लगा रहा हूँ कि इनमें से कौन-कौन रेंडर कर सकता हूँ",
			"sev_catastrophe": "विनाशकारी",
			"sev_cosmetic": "सतही",
			"sev_major": "गंभीर",
			"sev_minor": "मामूली",
			"stage_checking_hierarchy": "पदानुक्रम, कॉन्ट्रास्ट और कंटेंट जाँच रहा हूँ",
			"stage_double_checking": "हर निष्कर्ष को दोबारा जाँच रहा हूँ",
			"stage_getting_pixels": "देखने के लिए असली पिक्सल ला रहा हूँ",
			"stage_reading_screens": "स्क्रीन पढ़ रहा हूँ",
			"stage_weighing_task": "इसे कार्य के हिसाब से तौल रहा हूँ",
			"stage_writing_up": "समीक्षा लिख रहा हूँ",
			"wait_figma": "Figma फ़ाइल खोल रहा हूँ और उसके फ़्रेम सूचीबद्ध कर रहा हूँ…",
			"wait_local": "रूट के लिए कोड स्कैन कर रहा हूँ…",
			"wait_repo": "रिपो क्लोन कर रहा हूँ और उसके रूट सूचीबद्ध कर रहा हूँ…",
			"wait_url": "पेज लोड कर रहा हूँ और उसके लिंक फ़ॉलो कर रहा हूँ…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "एक समीक्षा अभी चल रही है — देखने के लिए क्लिक करें",
			"across_the_flow": "पूरे फ़्लो में",
			"click_to_enlarge": "बड़ा करने के लिए क्लिक करो",
			"close_esc": "बंद करें (Esc)",
			"couldn_t_see": "देख नहीं सके",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "समझ नहीं आया कि यह क्या है। मुझे Figma लिंक, GitHub/GitLab/Bitbucket रेपो, कोई absolute लोकल पाथ, या पहले से चल रहा URL दो।",
			"critique_ready": "समीक्षा तैयार",
			"critique_untitled": "समीक्षा",
			"design_critique": "Design Critique",
			"enlarge": "बड़ा करें",
			"full_size": "पूरा आकार",
			"full_size_view": "पूरे आकार में देखें",
			"history_count": "इतिहास ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "मैं अंदर पहुँच गया, पर वहाँ रेंडर करने लायक कुछ नहीं है। बेहतर होगा स्क्रीनशॉट भेज दें।",
			"new": "नया",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "दिखाने के लिए कोई स्क्रीन नहीं — समीक्षक इसके पिक्सेल नहीं ले सका। पैनल में \"देख नहीं सके\" देखें।",
			"nothing_major": "कुछ बड़ा नहीं",
			"numbered_pins_mark_issues_on_this_screen": "नंबर वाले पिन इस स्क्रीन की समस्याएँ दिखाते हैं",
			"on_screen": "● स्क्रीन पर",
			"only_added_the_first_room_the_limit_is_max_screens": "सिर्फ़ पहली {{room}} जोड़ी गईं — सीमा {{max}} स्क्रीन है।",
			"pick_a_step_above": "ऊपर कोई चरण चुनो",
			"point_me_at_a_running_url": "मुझे कोई चालू URL बताएँ",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "मुझे कोई स्क्रीन — या पूरा फ़्लो — दिखाएँ, और मैं उसे एक डिज़ाइनर दोस्त की तरह पढ़ूँगा: क्या अच्छा चल रहा है, क्या कसना है, और क्यों।",
			"running": "चल रही है",
			"screen_heading": "स्क्रीन",
			"screens_in_order": "क्रम से स्क्रीन",
			"see_an_example": "एक उदाहरण देखें",
			"send_screenshots": "स्क्रीनशॉट भेजें",
			"show_this_screen": "यह स्क्रीन दिखाएँ",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "नई समीक्षा शुरू करें — जो पहले से चल रहा है वह चलता रहेगा",
			"step_n": "चरण {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "समीक्षा बदलें",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "यह {{max}} स्क्रीन की सीमा है।",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "क्या कसना है",
			"what_s_working": "क्या अच्छा चल रहा है",
			"what_you_ll_get": "तुम्हें क्या मिलेगा",
			"your_critiques": "तुम्हारी समीक्षाएँ",
			"your_question_click_to_see_the_answer": "तुम्हारा सवाल — उत्तर देखने के लिए क्लिक करो",
			"rail_uploading": "अपलोड हो रहा है…",
			"rail_reading": "तुम्हारा डिज़ाइन पढ़ा जा रहा है…",
			"rail_flow_one": "{{n}} स्क्रीन का फ़्लो — मैं उनके बीच के बदलाव भी जाँचूँगा।",
			"rail_flow_other": "{{n}} स्क्रीन का फ़्लो — मैं उनके बीच के बदलाव भी जाँचूँगा।",
			"rail_one_screen": "एक स्क्रीन।",
			"rail_pending_figma": "एक Figma फ़ाइल — आँकने से पहले रेंडर हो रही है।",
			"rail_pending_repo": "एक रिपॉज़िटरी — आँकने से पहले रेंडर हो रही है।",
			"rail_pending_local": "स्थानीय कोड — आँकने से पहले रेंडर हो रहा है।",
			"rail_pending_url": "एक चल रहा ऐप — आँकने से पहले रेंडर हो रहा है।",
			"rail_pending_design": "एक डिज़ाइन — आँकने से पहले रेंडर हो रहा है।",
			"rail_getting_ready": "स्क्रीन तैयार की जा रही हैं।",
			"critique_ready_fallback": "समीक्षा तैयार",
			"ask_too_long": "बहुत देर लगी — फिर से पूछें।",
			"ask_went_wrong": "कुछ गड़बड़ हो गई।",
			"entry_meta_screens_one": "{{n}} स्क्रीन · {{when}}",
			"entry_meta_screens_other": "{{n}} स्क्रीन · {{when}}",
			"findings_count_one": "{{n}} टिप्पणी",
			"findings_count_other": "{{n}} टिप्पणियाँ",
			"nothing_flagged": "कुछ चिह्नित नहीं",
			"design_critique_fallback": "डिज़ाइन समीक्षा",
			"flow_screens_count_one": "{{n}} स्क्रीन",
			"flow_screens_count_other": "{{n}} स्क्रीन",
			"screen_n": "स्क्रीन {{n}}",
			"get_overall_read": "यह कैसा चल रहा है, इसकी कुल राय",
			"get_whats_working": "क्या ठीक काम कर रहा है, ताकि वह अगले बदलाव में बचा रहे",
			"get_top_things": "कसने लायक मुख्य बातें, स्क्रीन पर निशानों के साथ",
			"no_critiques_narrow": "अभी कोई समीक्षा नहीं। नीचे एक स्क्रीनशॉट डालें।",
			"no_critiques_wide": "अभी कोई समीक्षा नहीं। पैनल में एक स्क्रीनशॉट डालें →",
			"the_design_alt": "डिज़ाइन"
		},
		findingRow: {
			"based_on": "किस आधार पर",
			"finding": "निष्कर्ष",
			"fix": "सुधार",
			"suggestion": "सुझाव",
			"what_i_saw": "मैंने क्या देखा",
			"where": "कहाँ",
			"steps_range": "चरण {{range}}",
			"flow_badge": "फ़्लो"
		},
		manifest: {
			"description": "किसी साथी से पूछने से पहले खुद चलाई जा सकने वाली डिज़ाइन समीक्षा। इसे एक स्क्रीनशॉट, पूरा कई-स्क्रीन वाला फ़्लो, कोई Figma फ़ाइल, कोई git रिपो, या पहले से चल रहा URL दो, और यह संभावित स्क्रीन ढूँढ़ता है, तुम्हें चुनने देता है कि क्या देखना है, फिर एक तजुर्बेकार डिज़ाइनर की तरह बताता है: कुल मिलाकर क्या लगा, क्या ठीक काम कर रहा है, और किन चीज़ों को कसने की ज़रूरत है, हर बात किसी नामित ह्यूरिस्टिक से जुड़ी। कई-स्क्रीन वाले फ़्लो को क्रॉस-स्क्रीन नतीजे भी मिलते हैं जो एक स्क्रीन नहीं दिखा सकती — बेमेल कंट्रोल, गायब प्रगति, वापस जाने का रास्ता न होना, बंद गलियाँ। यह कोड और Figma को आँकने से पहले रेंडर करता है, इसलिए बिना देखे विज़ुअल पर कभी टिप्पणी नहीं करता, और अंदाज़ा लगाने की जगह साफ़ कह देता है कि किन स्क्रीन तक नहीं पहुँच पाया।",
			"display_name": "Design Critique",
			"use_case_1": "एक स्क्रीन या पूरे उत्पाद प्रवाह की समीक्षा करें और दिखने वाले क्षेत्रों से जुड़े, गंभीरता के अनुसार क्रमबद्ध, heuristic-आधारित निष्कर्ष पाएँ।",
			"configuration_1": "बिना सेटअप समीक्षा के लिए स्क्रीनशॉट डालें, या Figma फ़ाइल, रिपॉज़िटरी, लोकल फ़ोल्डर अथवा पहले से चल रहा URL दें; निजी GitHub स्रोतों के लिए gh auth login की आवश्यकता हो सकती है।",
			"highlight_1": "स्क्रीनशॉट, Figma लिंक, git रिपो, लोकल फ़ोल्डर, या चल रहा URL लेता है — और शुरू करने से पहले बताता है कि उसे क्या मिला",
			"highlight_2": "कंट्रास्ट और हिट-टारगेट के आकार तस्वीर से अंदाज़ा लगाने की जगह रेंडर हुए पेज से नापता है",
			"highlight_3": "कई-स्क्रीन वाले फ़्लो को क्रॉस-स्क्रीन जाँच मिलती है: कंट्रोल की एकरूपता, प्रगति, वापस जाने का रास्ता, बार-बार वही माँग, बंद गलियाँ",
			"highlight_4": "हर नतीजा अपने पीछे की ह्यूरिस्टिक का नाम देता है (Nielsen 1-10, WCAG, Gestalt, Fitts) और NN/g 1-4 पैमाने पर गंभीरता बताता है",
			"highlight_5": "रिपोर्ट की किसी भी लाइन को चुनो और वहीं उसके बारे में आगे सवाल पूछो",
			"highlight_6": "खाली या रुकी हुई स्क्रीन पर टिप्पणी करने की जगह बताता है कि वह क्या नहीं देख पाया",
			"highlight_7": "जिस काम की समीक्षा करता है उसे छूता नहीं: वह उस प्रोजेक्ट की डिपेंडेंसी इंस्टॉल नहीं करता, उसकी स्क्रिप्ट नहीं चलाता, उसका डेव सर्वर शुरू नहीं करता, और उसकी फ़ाइलें नहीं बदलता",
			"highlight_8": "तस्वीरें लेने के लिए यह हेडलेस ब्राउज़र इस्तेमाल करता है, जो पहली बार में तुम्हारी होम डायरेक्टरी के कैश में एक बार डाउनलोड होता है, प्रोजेक्ट में कभी नहीं",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "इस फ़्लो की समीक्षा करो · {{count}} स्क्रीन",
			"critique_this_flow_count_screens_other": "इस फ़्लो की समीक्षा करो · {{count}} स्क्रीन",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "क्रम बदलने के लिए खींचें",
			"move_earlier": "पहले ले जाएँ",
			"move_later": "बाद में ले जाएँ",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "वैकल्पिक ब्रीफ़: यह किसके लिए है, और मुख्य काम क्या है?",
			"optional_who_is_it_for_and_what_s_the_main_task": "वैकल्पिक: यह किसके लिए है, और मुख्य काम क्या है?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "स्क्रीन",
			"start_over": "फिर से शुरू करें",
			"suggested_flows": "सुझाए गए फ़्लो",
			"what_should_i_audit": "मैं किसका ऑडिट करूँ?",
			"screens_found_count_one": "{{n}} स्क्रीन मिली · {{m}} रेंडर कर सकता हूँ",
			"screens_found_count_other": "{{n}} स्क्रीन मिलीं · {{m}} रेंडर कर सकता हूँ",
			"flow_n": "फ़्लो {{n}}",
			"picked_count_one": "{{n}} चुनी",
			"picked_count_other": "{{n}} चुनीं",
			"hint_order": "नंबर वह क्रम हैं जिसमें मैं इन्हें देखूँगा — क्रम बदलने के लिए पंक्ति खींचो, या कीबोर्ड से ‹ › दबाओ।",
			"hint_pick": "चुनने के लिए किसी स्क्रीन पर क्लिक करो। फ़्लो के रूप में समीक्षा के लिए कई चुनो।",
			"cant_render_title": "इसे मैं रेंडर नहीं कर सकता",
			"cant_render_short": "रेंडर नहीं होगी",
			"group_fallback": "स्क्रीन",
			"tag_from_links": "लिंक से",
			"tag_guess": "अनुमान"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "मैं इसे कैप्चर करके असली कंट्रास्ट और आकार मापूँगा।",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "मैं इसे क्लोन करके स्क्रीन की सूची बनाऊँगा। सिर्फ़ वही पेज दिखते हैं जो बिना सर्वर के रेंडर होते हैं।",
			"i_ll_list_the_screens_only_pages_that_render_wit": "मैं स्क्रीन की सूची बनाऊँगा। सिर्फ़ वही पेज दिखते हैं जो बिना सर्वर के रेंडर होते हैं।",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "इसे अभी चलना चाहिए। मैं इसे लाइव कैप्चर करके असली कंट्रास्ट और आकार मापूँगा।",
			"not_something_i_recognise_give_me_a_figma_link_a": "मैं इसे नहीं पहचानता। मुझे Figma लिंक, GitHub रिपॉज़िटरी, पूरा स्थानीय पाथ या पहले से चल रहा URL दो।",
			"screen_fallback": "स्क्रीन"
		},
		waitingScreen: {
			"cancel_this_run": "यह रन रद्द करें",
			"stop_this_run_and_discard_it": "यह रन रोकें और हटा दें",
			"getting_screens_ready": "स्क्रीन तैयार की जा रही हैं…",
			"title_scanning": "ऑडिट के लिए स्क्रीन ढूँढ रहा हूँ",
			"title_uploading_screens_one": "{{n}} स्क्रीन अपलोड हो रही है…",
			"title_uploading_screens_other": "{{n}} स्क्रीन अपलोड हो रही हैं…",
			"title_uploading_one": "तुम्हारा स्क्रीनशॉट अपलोड हो रहा है…",
			"title_reading_flow_one": "तुम्हारा फ़्लो पढ़ रहा हूँ · {{n}} स्क्रीन",
			"title_reading_flow_other": "तुम्हारा फ़्लो पढ़ रहा हूँ · {{n}} स्क्रीन",
			"title_reading_screen": "तुम्हारी स्क्रीन पढ़ रहा हूँ",
			"title_getting_pixels": "पहले असली पिक्सेल ले रहा हूँ",
			"foot_still_going": "अभी चल रहा है — घना फ़्लो कुछ मिनट ले सकता है। तुम यह पेज छोड़ सकते हो; समीक्षा चलती रहेगी और लौटने पर यहीं मिलेगी।",
			"foot_navigate_away": "तुम यह पेज छोड़ सकते हो — समीक्षा चलती रहेगी।"
		},
		common: {
			"send_failed": "भेजना विफल",
			"unexpected_server_response": "सर्वर से अनपेक्षित प्रतिक्रिया"
		}
	},
	it: {
		askLayer: {
			"answer_failed_ask_again_below": "Risposta non riuscita — chiedi di nuovo qui sotto",
			"ask_a_follow_up": "Fai un’altra domanda…",
			"ask_again": "Chiedi di nuovo…",
			"what_dont_you_understand_about_this": "Cosa non ti è chiaro qui?",
			"ask": "Chiedi",
			"ask_about_this": "Fai una domanda",
			"close": "Chiudi",
			"remove_this_annotation": "Rimuovi questa annotazione",
			"thinking": "Sto pensando…",
			"question_label": "La tua domanda su questa critica"
		},
		composer: {
			"add_screens": "Aggiungi schermate",
			"add_screenshots_or_paste_a_link_first": "Prima aggiungi degli screenshot o incolla un link",
			"clear_all": "Cancella tutto",
			"critique_this_flow_count_screens_one": "Critica questo flusso · {{count}} schermata",
			"critique_this_flow_count_screens_many": "Critica questo flusso · {{count}} schermate",
			"critique_this_flow_count_screens_other": "Critica questo flusso · {{count}} schermate",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Trascina gli screenshot — o clicca per sfogliare",
			"fix_my_access": "Sistema il mio accesso",
			"fix_the_link": "Correggi il link",
			"hide_access_steps": "Nascondi i passaggi di accesso",
			"move_earlier": "Sposta prima",
			"move_later": "Sposta dopo",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "una schermata, o più in sequenza per un flusso · PNG, JPG, WebP",
			"remove": "Rimuovi",
			"remove_name": "Rimuovi {{name}}",
			"send_screenshots": "Invia gli screenshot",
			"start_the_critique": "Avvia la critica",
			"step_n": "Passo {{n}}",
			"try_again": "Riprova",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Usa invece una cartella locale",
			"start_kind_figma": "Critica il file Figma",
			"start_kind_repo": "Critica il repository",
			"start_kind_local": "Critica il codice locale",
			"start_kind_url": "Critica l’app in esecuzione",
			"start_this": "Critica questo",
			"start_plain": "Critica",
			"staged_one_hint": "1 schermata · aggiungine un’altra per criticarle come un flusso.",
			"staged_flow_hint_one": "{{n}} schermata · questo è l’ordine del flusso — riordina o rimuovi prima di iniziare.",
			"staged_flow_hint_many": "{{n}} schermate · questo è l’ordine del flusso — riordina o rimuovi prima di iniziare.",
			"staged_flow_hint_other": "{{n}} schermate · questo è l’ordine del flusso — riordina o rimuovi prima di iniziare.",
			"title_blocked": "Non sono riuscito a entrare",
			"title_ask": "Cosa devo criticare?",
			"link_placeholder_staged": "Sto usando i tuoi screenshot — rimuovili per criticare un link",
			"link_placeholder": "Link Figma · repository git · una cartella su questo computer · un URL in esecuzione (localhost o un’anteprima distribuita)",
			"link_label": "Link da criticare",
			"render_before_judging": "Eseguo il rendering di tutto prima di giudicarlo, mai solo dal codice. Se la tua app è già in esecuzione, incolla il suo URL e potrò misurare colori e dimensioni reali invece di stimarli."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Apri il file in Figma desktop e riprova, oppure esporta i frame come PNG e trascinali qui.",
			"blocked_figma_app_missing_say": "Non riesco a raggiungere Figma — l’app desktop non è in esecuzione, oppure non ho a disposizione gli strumenti Figma.",
			"blocked_figma_export_needed_hint": "Esporta ogni frame come PNG e trascinali qui come screenshot — tanto i pixel li critico comunque.",
			"blocked_figma_export_needed_say": "Qui non riesco a tirare i frame direttamente da un link di Figma — non ho gli strumenti desktop di Figma.",
			"blocked_figma_file_closed_hint": "Aprilo in Figma desktop, poi riprova.",
			"blocked_figma_file_closed_say": "Figma è in esecuzione, ma quel file non è aperto.",
			"blocked_figma_no_permission_auth_lead": "L’accesso a Figma è per account e io leggo ciò che l’app desktop ha aperto — non ho un login mio. Ecco come risolvere.",
			"blocked_figma_no_permission_auth_step_1": "1. Chiedi al proprietario del file di condividerlo con il tuo account Figma",
			"blocked_figma_no_permission_auth_step_2": "2. Aprilo in Figma desktop",
			"blocked_figma_no_permission_auth_step_3": "3. Torna qui e premi Riprova",
			"blocked_figma_no_permission_auth_tail": "Se l’accesso non arriva, esportare i frame come PNG funziona altrettanto bene — in ogni caso critico i pixel.",
			"blocked_figma_no_permission_hint": "Chiedi l’accesso, oppure esporta i frame come PNG e trascinali qui.",
			"blocked_figma_no_permission_say": "Il tuo account Figma non può visualizzare quel file.",
			"blocked_no_access_hint": "Se ne hai già una copia locale, dammi invece il percorso della cartella.",
			"blocked_no_access_say": "Non sono riuscito ad aprire quel repo. O è privato (e non ho credenziali per accedervi) oppure non esiste — GitHub restituisce lo stesso errore in entrambi i casi.",
			"blocked_not_found_hint": "Controlla proprietario e nome, oppure dammi il percorso di una cartella locale.",
			"blocked_not_found_say": "Quel repo non esiste a quell’URL.",
			"blocked_other_hint": "Gli screenshot sono il modo più rapido per aggirare il problema.",
			"blocked_other_say": "Non sono riuscito ad accedervi.",
			"kind_figma": "File Figma",
			"kind_local": "codice locale",
			"kind_repo": "repo",
			"kind_url": "app in esecuzione",
			"scan_finding_screens": "Ricerca delle schermate",
			"scan_grouping_flows": "Raggruppamento nei flussi probabili",
			"scan_which_renderable": "Individuazione di quelle che posso renderizzare",
			"sev_catastrophe": "Catastrofe",
			"sev_cosmetic": "Estetico",
			"sev_major": "Grave",
			"sev_minor": "Lieve",
			"stage_checking_hierarchy": "Verifica di gerarchia, contrasto e contenuto",
			"stage_double_checking": "Ricontrollo di ogni riscontro",
			"stage_getting_pixels": "Recupero dei pixel reali da esaminare",
			"stage_reading_screens": "Lettura delle schermate",
			"stage_weighing_task": "Valutazione rispetto all’obiettivo",
			"stage_writing_up": "Stesura della critica",
			"wait_figma": "Apertura del file Figma ed elenco dei suoi frame…",
			"wait_local": "Scansione del codice in cerca di route…",
			"wait_repo": "Clonazione del repo ed elenco delle sue route…",
			"wait_url": "Caricamento della pagina e navigazione dei suoi link…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Una critica è ancora in corso — clicca per seguirla",
			"across_the_flow": "In tutto il flusso",
			"click_to_enlarge": "Fai clic per ingrandire",
			"close_esc": "Chiudi (Esc)",
			"couldn_t_see": "Non ho potuto vedere",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "Non sono riuscito a capire cosa sia. Dammi un link Figma, un repository GitHub/GitLab/Bitbucket, un percorso locale assoluto o un URL già in esecuzione.",
			"critique_ready": "critica pronta",
			"critique_untitled": "Critica",
			"design_critique": "Design Critique",
			"enlarge": "Ingrandisci",
			"full_size": "dimensione reale",
			"full_size_view": "Vista a dimensione reale",
			"history_count": "Cronologia ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Sono entrato, ma lì dentro non c’è niente che io possa renderizzare. Mandami piuttosto degli screenshot.",
			"new": "Nuova",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "Nessuna schermata da mostrare — il critico non è riuscito a ottenere i pixel per questa. Vedi “Non ho potuto vedere” nel pannello.",
			"nothing_major": "niente di grave",
			"numbered_pins_mark_issues_on_this_screen": "i segnaposto numerati indicano i problemi di questa schermata",
			"on_screen": "● sulla schermata",
			"only_added_the_first_room_the_limit_is_max_screens": "Aggiunte solo le prime {{room}} — il limite è di {{max}} schermate.",
			"pick_a_step_above": "scegli un passo qui sopra",
			"point_me_at_a_running_url": "Indicami un URL attivo",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Indicami una schermata — o un intero flusso — e la leggerò come farebbe un amico designer: cosa funziona, cosa rifinire e perché.",
			"running": "in esecuzione",
			"screen_heading": "Schermata",
			"screens_in_order": "Schermate in ordine",
			"see_an_example": "Guarda un esempio",
			"send_screenshots": "Invia gli screenshot",
			"show_this_screen": "Mostra questa schermata",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Avvia una nuova critica — quelle già in corso proseguono",
			"step_n": "Passo {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "Cambia critica",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "Questo è il limite di {{max}} schermate.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "Cosa rifinirei",
			"what_s_working": "Cosa funziona",
			"what_you_ll_get": "Cosa otterrai",
			"your_critiques": "Le tue critiche",
			"your_question_click_to_see_the_answer": "La tua domanda — clicca per vedere la risposta",
			"rail_uploading": "Caricamento…",
			"rail_reading": "Lettura del tuo design…",
			"rail_flow_one": "Un flusso di {{n}} schermata — controllerò anche i passaggi tra loro.",
			"rail_flow_many": "Un flusso di {{n}} schermate — controllerò anche i passaggi tra loro.",
			"rail_flow_other": "Un flusso di {{n}} schermate — controllerò anche i passaggi tra loro.",
			"rail_one_screen": "Una schermata.",
			"rail_pending_figma": "Un file Figma — lo renderizzo prima di giudicarlo.",
			"rail_pending_repo": "Un repository — lo renderizzo prima di giudicarlo.",
			"rail_pending_local": "Codice locale — lo renderizzo prima di giudicarlo.",
			"rail_pending_url": "Un’app in esecuzione — la renderizzo prima di giudicarla.",
			"rail_pending_design": "Un design — lo renderizzo prima di giudicarlo.",
			"rail_getting_ready": "Preparo le schermate.",
			"critique_ready_fallback": "Critica pronta",
			"ask_too_long": "Ci è voluto troppo — chiedi di nuovo.",
			"ask_went_wrong": "Qualcosa è andato storto.",
			"entry_meta_screens_one": "{{n}} schermata · {{when}}",
			"entry_meta_screens_many": "{{n}} schermate · {{when}}",
			"entry_meta_screens_other": "{{n}} schermate · {{when}}",
			"findings_count_one": "{{n}} osservazione",
			"findings_count_many": "{{n}} osservazioni",
			"findings_count_other": "{{n}} osservazioni",
			"nothing_flagged": "niente da segnalare",
			"design_critique_fallback": "Critica del design",
			"flow_screens_count_one": "{{n}} schermata",
			"flow_screens_count_many": "{{n}} schermate",
			"flow_screens_count_other": "{{n}} schermate",
			"screen_n": "Schermata {{n}}",
			"get_overall_read": "Una valutazione complessiva di come va",
			"get_whats_working": "Cosa funziona, così resiste al prossimo giro",
			"get_top_things": "Le cose principali da sistemare, con segnaposti sulla schermata",
			"no_critiques_narrow": "Ancora nessuna critica. Trascina uno screenshot qui sotto.",
			"no_critiques_wide": "Ancora nessuna critica. Trascina uno screenshot nel pannello →",
			"the_design_alt": "Il design"
		},
		findingRow: {
			"based_on": "Basato su",
			"finding": "Rilievo",
			"fix": "Correzione",
			"suggestion": "Suggerimento",
			"what_i_saw": "Cosa ho visto",
			"where": "Dove",
			"steps_range": "passi {{range}}",
			"flow_badge": "flusso"
		},
		manifest: {
			"description": "Una critica di design da fare prima di chiederla a un collega. Dagli uno screenshot, un intero flusso su più schermate, un file Figma, un repo git o un URL già in servizio: individua le schermate candidate, ti lascia scegliere cosa guardare e poi riferisce come farebbe un designer esperto: una lettura d’insieme, ciò che funziona e le cose da stringere, ognuna legata a un’euristica indicata per nome. I flussi su più schermate ricevono anche rilievi trasversali che una singola schermata non può mostrare — comandi incoerenti, avanzamento assente, nessuna via di ritorno, vicoli ciechi. Prima di giudicarli rende il codice e Figma, così non critica mai elementi visivi che non ha davvero visto, e dice chiaramente a quali schermate non è riuscito ad arrivare invece di tirare a indovinare.",
			"display_name": "Design Critique",
			"highlight_1": "Accetta screenshot, un link Figma, un repo git, una cartella locale o un URL attivo — e dice cosa ha trovato prima di iniziare",
			"highlight_2": "Misura contrasto e dimensioni delle aree cliccabili sulla pagina resa, invece di stimarli da un’immagine",
			"highlight_3": "I flussi su più schermate ottengono verifiche trasversali: coerenza dei comandi, avanzamento, via di ritorno, richieste ripetute, vicoli ciechi",
			"highlight_4": "Ogni rilievo indica l’euristica che lo motiva (Nielsen 1-10, WCAG, Gestalt, Fitts) e porta una gravità sulla scala NN/g 1-4",
			"highlight_5": "Seleziona una riga qualsiasi del report e poni una domanda di approfondimento direttamente lì",
			"highlight_6": "Ti dice cosa non è riuscito a vedere invece di criticare una schermata vuota o bloccata",
			"highlight_7": "Non tocca il progetto che esamina: non installa mai le sue dipendenze, non esegue i suoi script, non avvia il suo dev server e non modifica i suoi file",
			"highlight_8": "Per catturare le immagini usa un browser headless, scaricato una sola volta al primo utilizzo in una cache nella tua home e mai dentro il progetto",
			"page_label": "Design Critique",
			"use_case_1": "Valuta una schermata o un flusso di prodotto completo con risultati ordinati per gravità, basati su euristiche e collegati alle aree visibili.",
			"configuration_1": "Trascina screenshot per una revisione senza configurazione oppure fornisci un file Figma, un repository, una cartella locale o un URL già attivo; le fonti GitHub private possono richiedere gh auth login."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Critica questo flusso · {{count}} schermata",
			"critique_this_flow_count_screens_many": "Critica questo flusso · {{count}} schermate",
			"critique_this_flow_count_screens_other": "Critica questo flusso · {{count}} schermate",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Trascina per riordinare",
			"move_earlier": "Sposta prima",
			"move_later": "Sposta dopo",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Brief facoltativo: a chi è rivolto e qual è il compito principale?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Facoltativo: a chi è rivolto e qual è il compito principale?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Schermate",
			"start_over": "Ricomincia",
			"suggested_flows": "Flussi suggeriti",
			"what_should_i_audit": "Cosa devo esaminare?",
			"screens_found_count_one": "{{n}} schermata trovata · {{m}} che posso renderizzare",
			"screens_found_count_many": "{{n}} schermate trovate · {{m}} che posso renderizzare",
			"screens_found_count_other": "{{n}} schermate trovate · {{m}} che posso renderizzare",
			"flow_n": "Flusso {{n}}",
			"picked_count_one": "{{n}} scelta",
			"picked_count_many": "{{n}} scelte",
			"picked_count_other": "{{n}} scelte",
			"hint_order": "I numeri sono l’ordine in cui le percorro — trascina una riga per riordinare, o usa ‹ › dalla tastiera.",
			"hint_pick": "Fai clic su una schermata per sceglierla. Scegline più di una per criticarle come un flusso.",
			"cant_render_title": "Questa non riesco a renderizzarla",
			"cant_render_short": "non renderizzabile",
			"group_fallback": "Schermate",
			"tag_from_links": "Dai link",
			"tag_guess": "Ipotesi"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "La catturerò e misurerò contrasto e dimensioni reali.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Lo clonerò ed elencherò le schermate. Sono visibili solo le pagine che si renderizzano senza server.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Elencherò le schermate. Sono visibili solo le pagine che si renderizzano senza server.",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "deve essere in esecuzione adesso. La catturerò dal vivo e misurerò contrasto e dimensioni reali.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Non lo riconosco. Dammi un link Figma, un repository GitHub, un percorso locale assoluto o un URL già servito.",
			"screen_fallback": "Schermata"
		},
		waitingScreen: {
			"cancel_this_run": "Annulla questa esecuzione",
			"stop_this_run_and_discard_it": "Arresta questa esecuzione e scartala",
			"getting_screens_ready": "Preparo le schermate…",
			"title_scanning": "Cerco schermate da esaminare",
			"title_uploading_screens_one": "Caricamento di {{n}} schermata…",
			"title_uploading_screens_many": "Caricamento di {{n}} schermate…",
			"title_uploading_screens_other": "Caricamento di {{n}} schermate…",
			"title_uploading_one": "Caricamento del tuo screenshot…",
			"title_reading_flow_one": "Leggo il tuo flusso · {{n}} schermata",
			"title_reading_flow_many": "Leggo il tuo flusso · {{n}} schermate",
			"title_reading_flow_other": "Leggo il tuo flusso · {{n}} schermate",
			"title_reading_screen": "Leggo la tua schermata",
			"title_getting_pixels": "Prima ottengo pixel reali",
			"foot_still_going": "Ancora in corso — un flusso denso può richiedere un paio di minuti. Puoi uscire dalla pagina; la critica continua e sarà qui quando torni.",
			"foot_navigate_away": "Puoi uscire dalla pagina — la critica continua."
		},
		common: {
			"send_failed": "Invio non riuscito",
			"unexpected_server_response": "Risposta del server inaspettata"
		}
	},
	ja: {
		askLayer: {
			"answer_failed_ask_again_below": "回答に失敗しました — 下でもう一度質問してください",
			"ask_a_follow_up": "続けて質問する…",
			"ask_again": "もう一度質問する…",
			"what_dont_you_understand_about_this": "ここで分からないことは何ですか？",
			"ask": "質問する",
			"ask_about_this": "この件について質問する",
			"close": "閉じる",
			"remove_this_annotation": "このアノテーションを削除",
			"thinking": "考え中…",
			"question_label": "この批評についての質問"
		},
		composer: {
			"add_screens": "スクリーンを追加",
			"add_screenshots_or_paste_a_link_first": "先にスクリーンショットを追加するか、リンクを貼り付けてください",
			"clear_all": "すべてクリア",
			"critique_this_flow_count_screens_other": "このフローを批評 · スクリーン {{count}} 件",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "スクリーンショットをドラッグするか、クリックして参照",
			"fix_my_access": "アクセスを修正",
			"fix_the_link": "リンクを修正",
			"hide_access_steps": "アクセス手順を隠す",
			"move_earlier": "前に移動",
			"move_later": "後に移動",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "1つのスクリーン、またはフローの順序で複数 · PNG、JPG、WebP",
			"remove": "削除",
			"remove_name": "{{name}} を削除",
			"send_screenshots": "スクリーンショットを送信",
			"start_the_critique": "批評を開始",
			"step_n": "ステップ {{n}}",
			"try_again": "もう一度試す",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "代わりにローカルフォルダーを使用",
			"start_kind_figma": "Figma ファイルを批評",
			"start_kind_repo": "リポジトリを批評",
			"start_kind_local": "ローカルのコードを批評",
			"start_kind_url": "実行中のアプリを批評",
			"start_this": "これを批評",
			"start_plain": "批評",
			"staged_one_hint": "1 画面 · もう 1 つ追加するとフローとして批評できます。",
			"staged_flow_hint_other": "{{n}} 画面 · この順番がフローの順番です。開始前に並べ替えるか削除してください。",
			"title_blocked": "中に入れませんでした",
			"title_ask": "何を批評しますか？",
			"link_placeholder_staged": "スクリーンショットを使用中です。リンクを批評するにはスクリーンショットを削除してください",
			"link_placeholder": "Figma リンク · git リポジトリ · このマシン上のフォルダー · 実行中の URL（localhost またはデプロイ済みのプレビュー）",
			"link_label": "批評するリンク",
			"render_before_judging": "判断する前にすべてをレンダリングします。コードだけで判断することはありません。アプリがすでに動いている場合は URL を貼り付けてください。色やサイズを推測せず実測できます。"
		},
		constants: {
			"blocked_figma_app_missing_hint": "Figmaデスクトップでファイルを開いてもう一度試すか、フレームをPNGとしてエクスポートしてここにドラッグしてください。",
			"blocked_figma_app_missing_say": "Figmaに到達できません — デスクトップアプリが実行されていないか、Figmaツールが利用できません。",
			"blocked_figma_export_needed_hint": "各フレームをPNGとして書き出して、スクリーンショットとしてここにドロップしてください — どのみちピクセルを見て批評します。",
			"blocked_figma_export_needed_say": "ここではFigmaのリンクから直接フレームを取り込めません — Figmaのデスクトップツールが使えないんです。",
			"blocked_figma_file_closed_hint": "Figmaデスクトップで開いてから、もう一度試してください。",
			"blocked_figma_file_closed_say": "Figmaは実行されていますが、そのファイルは開いていません。",
			"blocked_figma_no_permission_auth_lead": "Figmaアクセスはアカウント単位で、デスクトップアプリで開いているものを読みます — 私は独自のログインがありません。ここで修正する方法を示します。",
			"blocked_figma_no_permission_auth_step_1": "1. ファイル所有者に、あなたのFigmaアカウントと共有するよう依頼してください",
			"blocked_figma_no_permission_auth_step_2": "2. Figmaデスクトップで開く",
			"blocked_figma_no_permission_auth_step_3": "3. 戻って「もう一度試す」を押す",
			"blocked_figma_no_permission_auth_tail": "アクセスが得られない場合は、フレームをPNGとしてエクスポートする方法も同様に機能します — ピクセルどちらにしても批評します。",
			"blocked_figma_no_permission_hint": "アクセスをリクエストするか、フレームをPNGとしてエクスポートしてここにドラッグしてください。",
			"blocked_figma_no_permission_say": "あなたのFigmaアカウントはそのファイルを表示できません。",
			"blocked_no_access_hint": "チェックアウトしている場合は、フォルダーパスを代わりに指定してください。",
			"blocked_no_access_say": "そのリポジトリを開くことができませんでした。プライベート（認証情報がない）か、存在しないかのいずれかです — GitHub は両方に対して同じエラーを返します。",
			"blocked_not_found_hint": "所有者と名前を確認するか、ローカルフォルダーパスを指定してください。",
			"blocked_not_found_say": "そのリポジトリはそのURLに存在しません。",
			"blocked_other_hint": "スクリーンショットはそれを回避する最速の方法です。",
			"blocked_other_say": "そこに入ることができませんでした。",
			"kind_figma": "Figmaファイル",
			"kind_local": "ローカルコード",
			"kind_repo": "リポジトリ",
			"kind_url": "実行中のアプリ",
			"scan_finding_screens": "スクリーンを探索中",
			"scan_grouping_flows": "フローにグループ化中",
			"scan_which_renderable": "レンダリング可能なものを判定中",
			"sev_catastrophe": "致命的",
			"sev_cosmetic": "見た目のみ",
			"sev_major": "主要",
			"sev_minor": "軽微",
			"stage_checking_hierarchy": "階層、コントラスト、コンテンツを確認中",
			"stage_double_checking": "各検出結果を再確認中",
			"stage_getting_pixels": "実際のピクセルを取得中",
			"stage_reading_screens": "スクリーンを読み込み中",
			"stage_weighing_task": "タスク対して評価中",
			"stage_writing_up": "批評を作成中",
			"wait_figma": "Figmaファイルを開いてフレームをリストアップ中…",
			"wait_local": "コードのルートをスキャン中…",
			"wait_repo": "リポジトリをクローンしてルートをリストアップ中…",
			"wait_url": "ページを読み込んでリンクをたどる中…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "批評実行中 — クリックして監視",
			"across_the_flow": "フロー全体",
			"click_to_enlarge": "クリックして拡大",
			"close_esc": "閉じる (Esc)",
			"couldn_t_see": "表示できませんでした",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "これが何か判別できませんでした。Figma のリンク、GitHub/GitLab/Bitbucket のリポジトリ、ローカルの絶対パス、または配信中の URL を指定してください。",
			"critique_ready": "批評完了",
			"critique_untitled": "批評",
			"design_critique": "Design Critique",
			"enlarge": "拡大",
			"full_size": "実際のサイズ",
			"full_size_view": "実際のサイズで表示",
			"history_count": "履歴（{{n}}）",
			"i_got_in_but_there_s_nothing_in_there_i_can": "入れましたが、そこにはレンダリングできるものが何もありません。代わりにスクリーンショットをドロップしてください。",
			"new": "新規",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "表示するスクリーンなし — 批評家はこれのピクセルを取得できませんでした。パネルの「表示できませんでした」を参照してください。",
			"nothing_major": "特に問題なし",
			"numbered_pins_mark_issues_on_this_screen": "番号付きのピンはこのスクリーンの問題を示します",
			"on_screen": "● 画面上",
			"only_added_the_first_room_the_limit_is_max_screens": "最初の {{room}} 枚のみ追加しました — 上限は {{max}} 枚です。",
			"pick_a_step_above": "上でステップを選んでください",
			"point_me_at_a_running_url": "実行中のURLを指定",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "スクリーン、またはフロー全体を指定してください — デザイナーの友人として読みます。動作している内容、改善点、理由を示します。",
			"running": "実行中",
			"screen_heading": "スクリーン",
			"screens_in_order": "順番どおりのスクリーン",
			"see_an_example": "例を見る",
			"send_screenshots": "スクリーンショットを送信",
			"show_this_screen": "このスクリーンを表示",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "新しい批評を開始 — 既に実行されているものは継続",
			"step_n": "ステップ {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "批評を切り替え",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "スクリーンの上限 {{max}} 枚に達しています。",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "改善すべき点",
			"what_s_working": "動作している点",
			"what_you_ll_get": "得られるもの",
			"your_critiques": "あなたの批評",
			"your_question_click_to_see_the_answer": "あなたの質問 — クリックして答えを表示",
			"rail_uploading": "アップロード中…",
			"rail_reading": "デザインを読み込み中…",
			"rail_flow_other": "{{n}} 画面のフロー — 画面間の移り変わりも確認します。",
			"rail_one_screen": "1 画面。",
			"rail_pending_figma": "Figma ファイル — 判断する前にレンダリングしています。",
			"rail_pending_repo": "リポジトリ — 判断する前にレンダリングしています。",
			"rail_pending_local": "ローカルのコード — 判断する前にレンダリングしています。",
			"rail_pending_url": "実行中のアプリ — 判断する前にレンダリングしています。",
			"rail_pending_design": "デザイン — 判断する前にレンダリングしています。",
			"rail_getting_ready": "画面を準備しています。",
			"critique_ready_fallback": "講評の準備ができました",
			"ask_too_long": "時間がかかりすぎました — もう一度質問してください。",
			"ask_went_wrong": "問題が発生しました。",
			"entry_meta_screens_other": "{{n}} 画面 · {{when}}",
			"findings_count_other": "指摘 {{n}} 件",
			"nothing_flagged": "指摘なし",
			"design_critique_fallback": "デザイン講評",
			"flow_screens_count_other": "{{n}} 画面",
			"screen_n": "画面 {{n}}",
			"get_overall_read": "全体としての出来ばえの評価",
			"get_whats_working": "うまくいっている点 (次の修正でも残すために)",
			"get_top_things": "直すべき主な点 (画面上のピン付き)",
			"no_critiques_narrow": "まだ講評はありません。下にスクリーンショットをドロップしてください。",
			"no_critiques_wide": "まだ講評はありません。パネルにスクリーンショットをドロップしてください →",
			"the_design_alt": "デザイン"
		},
		findingRow: {
			"based_on": "基づく",
			"finding": "指摘",
			"fix": "修正",
			"suggestion": "提案",
			"what_i_saw": "見たこと",
			"where": "場所",
			"steps_range": "ステップ {{range}}",
			"flow_badge": "フロー"
		},
		manifest: {
			"use_case_1": "1 画面または製品フロー全体を、表示領域に紐づく重要度順のヒューリスティックベースの指摘で評価します。",
			"configuration_1": "スクリーンショットをドロップすれば設定なしでレビューできます。Figma ファイル、リポジトリ、ローカルフォルダー、起動済みの URL も指定できます。非公開の GitHub ソースでは gh auth login が必要な場合があります。",
			"description": "同僚に相談する前に実行できるデザイン批評です。スクリーンショット、複数画面のフロー、Figma ファイル、Git リポジトリ、または公開中の URL を指定すると、候補画面を検出し、確認対象を選べます。その後、経験豊富なデザイナーのように、全体評価、良い点、改善すべき点を、それぞれ明確なヒューリスティックに結び付けて報告します。複数画面のフローでは、コントロールの不一致、進捗表示の欠如、戻る手段の欠如、行き止まりなど、単一画面では分からない問題も検出します。コードと Figma はレンダリングしてから評価するため、実際に確認していないビジュアルを批評せず、アクセスできなかった画面も推測せず明示します。",
			"display_name": "Design Critique",
			"highlight_1": "スクリーンショット、Figmaリンク、Gitリポジトリ、ローカルフォルダー、または実行中のURL受け取り — 開始前に見つけたものを返す",
			"highlight_2": "画像から推定するのではなく、レンダリングされたページから実際のコントラストおよびヒットターゲットサイズを測定",
			"highlight_3": "複数画面のフローでは、コントロールの一貫性、進捗、戻る手段、繰り返される要求、行き止まりを画面横断で確認",
			"highlight_4": "各検出結果がそれの背後にあるヒューリスティック（Nielsen 1-10、WCAG、Gestalt、Fitts）を指定して、NN/g 1-4スケールの重大度を持つ",
			"highlight_5": "レポートの任意の行を選択して、その場所について追加の質問をする",
			"highlight_6": "見ることができなかったことを示す代わりに空白または遮断されたスクリーンを批評しない",
			"highlight_7": "見直す作業から手を引く。そのプロジェクトの依存関係をインストールしたり、スクリプトを実行したり、dev サーバーを開始したり、ファイルを編集したりすることはありません",
			"highlight_8": "画像を撮るのにはヘッドレスブラウザーを使用。初回利用時にホームディレクトリのキャッシュに一度ダウンロードして、プロジェクトにはダウンロードされません",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_other": "このフローを批評 · スクリーン {{count}} 件",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "ドラッグして並び替え",
			"move_earlier": "前に移動",
			"move_later": "後に移動",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "オプション：対象者は誰で、主なタスクは何ですか？",
			"optional_who_is_it_for_and_what_s_the_main_task": "オプション：対象者は誰で、主なタスクは何ですか？",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "スクリーン",
			"start_over": "始め直す",
			"suggested_flows": "提案されたフロー",
			"what_should_i_audit": "何を監査すべきですか？",
			"screens_found_count_other": "{{n}} 画面を検出 · 描画できるのは {{m}} 画面",
			"flow_n": "フロー {{n}}",
			"picked_count_other": "{{n}} 件選択",
			"hint_order": "番号は確認する順番です — 行をドラッグして並べ替えるか、キーボードの ‹ › を使ってください。",
			"hint_pick": "画面をクリックして選択します。複数選ぶとフローとして講評します。",
			"cant_render_title": "この画面は描画できません",
			"cant_render_short": "描画不可",
			"group_fallback": "画面",
			"tag_from_links": "リンクから",
			"tag_guess": "推測"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "キャプチャして実際のコントラストとサイズを測定します。",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "クローンして画面を一覧にします。サーバーなしで表示できるページだけが見えます。",
			"i_ll_list_the_screens_only_pages_that_render_wit": "画面を一覧にします。サーバーなしで表示できるページだけが見えます。",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "今まさに動いている必要があります。ライブでキャプチャして、実際のコントラストとサイズを測定します。",
			"not_something_i_recognise_give_me_a_figma_link_a": "認識できません。Figma リンク、GitHub リポジトリ、ローカルの絶対パス、または配信中の URL を指定してください。",
			"screen_fallback": "画面"
		},
		waitingScreen: {
			"cancel_this_run": "このランをキャンセル",
			"stop_this_run_and_discard_it": "このランを停止して破棄",
			"getting_screens_ready": "画面を準備しています…",
			"title_scanning": "監査する画面を探しています",
			"title_uploading_screens_other": "{{n}} 画面をアップロード中…",
			"title_uploading_one": "スクリーンショットをアップロード中…",
			"title_reading_flow_other": "フローを読み込み中 · {{n}} 画面",
			"title_reading_screen": "画面を読み込み中",
			"title_getting_pixels": "まず実際のピクセルを取得しています",
			"foot_still_going": "まだ処理中です — 画面の多いフローは数分かかることがあります。このページを離れても講評は続き、戻ったときに表示されます。",
			"foot_navigate_away": "このページを離れても講評は続きます。"
		},
		common: {
			"send_failed": "送信に失敗しました",
			"unexpected_server_response": "予期しないサーバーレスポンス"
		}
	},
	ko: {
		askLayer: {
			"answer_failed_ask_again_below": "답변하지 못했습니다 — 아래에서 다시 질문하세요",
			"ask_a_follow_up": "이어서 질문하기…",
			"ask_again": "다시 질문하기…",
			"what_dont_you_understand_about_this": "이 부분에서 무엇이 이해되지 않나요?",
			"ask": "질문하기",
			"ask_about_this": "이 부분에 대해 질문하기",
			"close": "닫기",
			"remove_this_annotation": "이 주석 삭제",
			"thinking": "생각하는 중…",
			"question_label": "이 비평에 대한 질문"
		},
		composer: {
			"add_screens": "화면 추가",
			"add_screenshots_or_paste_a_link_first": "먼저 스크린샷을 추가하거나 링크를 붙여넣으세요",
			"clear_all": "모두 지우기",
			"critique_this_flow_count_screens_other": "이 플로 비평 · 화면 {{count}}개",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "스크린샷을 끌어다 놓거나 클릭해서 찾아보세요",
			"fix_my_access": "내 액세스 수정",
			"fix_the_link": "링크 수정",
			"hide_access_steps": "액세스 단계 숨기기",
			"move_earlier": "앞으로 이동",
			"move_later": "뒤로 이동",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "화면 하나, 또는 플로 순서대로 여러 개 · PNG, JPG, WebP",
			"remove": "삭제",
			"remove_name": "{{name}} 삭제",
			"send_screenshots": "스크린샷 보내기",
			"start_the_critique": "비평 시작",
			"step_n": "{{n}}단계",
			"try_again": "다시 시도",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "대신 로컬 폴더 사용",
			"start_kind_figma": "Figma 파일 비평",
			"start_kind_repo": "저장소 비평",
			"start_kind_local": "로컬 코드 비평",
			"start_kind_url": "실행 중인 앱 비평",
			"start_this": "이것 비평",
			"start_plain": "비평",
			"staged_one_hint": "화면 1개 · 하나를 더 추가하면 흐름으로 비평할 수 있습니다.",
			"staged_flow_hint_other": "화면 {{n}}개 · 이 순서가 흐름 순서입니다. 시작하기 전에 순서를 바꾸거나 제거하세요.",
			"title_blocked": "들어갈 수 없었습니다",
			"title_ask": "무엇을 비평할까요?",
			"link_placeholder_staged": "스크린샷을 사용하는 중입니다. 링크를 비평하려면 스크린샷을 지우세요",
			"link_placeholder": "Figma 링크 · git 저장소 · 이 컴퓨터의 폴더 · 실행 중인 URL(localhost 또는 배포된 미리 보기)",
			"link_label": "비평할 링크",
			"render_before_judging": "판단하기 전에 모든 것을 렌더링합니다. 코드만 보고 판단하지 않습니다. 앱이 이미 실행 중이면 URL을 붙여 넣으세요. 색상과 크기를 추정하지 않고 실제로 측정할 수 있습니다."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Figma 데스크톱에서 파일을 열고 다시 시도하거나, 프레임을 PNG로 내보내 여기에 끌어다 놓으세요.",
			"blocked_figma_app_missing_say": "Figma에 연결할 수 없습니다 — 데스크톱 앱이 실행 중이 아니거나 Figma 도구를 사용할 수 없습니다.",
			"blocked_figma_export_needed_hint": "각 프레임을 PNG로 내보내서 스크린샷으로 여기에 드롭해 주세요 — 어차피 픽셀을 보고 비평하니까요.",
			"blocked_figma_export_needed_say": "여기서는 Figma 링크에서 프레임을 바로 가져올 수 없어요 — Figma 데스크톱 도구가 없거든요.",
			"blocked_figma_file_closed_hint": "Figma 데스크톱에서 연 다음 다시 시도하세요.",
			"blocked_figma_file_closed_say": "Figma는 실행 중이지만 해당 파일이 열려 있지 않습니다.",
			"blocked_figma_no_permission_auth_lead": "Figma 액세스는 계정 단위이며, 저는 데스크톱 앱에 열려 있는 것만 읽습니다 — 제 계정은 따로 없습니다. 해결 방법은 다음과 같습니다.",
			"blocked_figma_no_permission_auth_step_1": "1. 파일 소유자에게 본인의 Figma 계정으로 공유해 달라고 요청하세요",
			"blocked_figma_no_permission_auth_step_2": "2. Figma 데스크톱에서 여세요",
			"blocked_figma_no_permission_auth_step_3": "3. 돌아와서 ‘다시 시도’를 누르세요",
			"blocked_figma_no_permission_auth_tail": "액세스를 받기 어렵다면 프레임을 PNG로 내보내도 똑같이 잘 됩니다 — 어느 쪽이든 픽셀을 보고 비평합니다.",
			"blocked_figma_no_permission_hint": "액세스를 요청하거나, 프레임을 PNG로 내보내 여기에 끌어다 놓으세요.",
			"blocked_figma_no_permission_say": "본인의 Figma 계정으로는 해당 파일을 볼 수 없습니다.",
			"blocked_no_access_hint": "이미 체크아웃해 두었다면 대신 폴더 경로를 알려 주세요.",
			"blocked_no_access_say": "해당 저장소를 열지 못했습니다. 비공개(자격 증명이 없음)이거나 존재하지 않는 것입니다 — GitHub은 두 경우 모두 같은 오류를 반환합니다.",
			"blocked_not_found_hint": "소유자와 이름을 확인하거나, 로컬 폴더 경로를 알려 주세요.",
			"blocked_not_found_say": "해당 URL에는 그런 저장소가 없습니다.",
			"blocked_other_hint": "스크린샷이 가장 빠른 우회 방법입니다.",
			"blocked_other_say": "거기에 접근하지 못했습니다.",
			"kind_figma": "Figma 파일",
			"kind_local": "로컬 코드",
			"kind_repo": "저장소",
			"kind_url": "실행 중인 앱",
			"scan_finding_screens": "화면을 찾는 중",
			"scan_grouping_flows": "예상 플로로 묶는 중",
			"scan_which_renderable": "렌더링할 수 있는 화면을 가려내는 중",
			"sev_catastrophe": "치명적",
			"sev_cosmetic": "외형",
			"sev_major": "주요",
			"sev_minor": "경미",
			"stage_checking_hierarchy": "위계, 대비, 콘텐츠를 확인하는 중",
			"stage_double_checking": "각 검토 결과를 재확인하는 중",
			"stage_getting_pixels": "실제 픽셀을 가져오는 중",
			"stage_reading_screens": "화면을 읽는 중",
			"stage_weighing_task": "과업 기준으로 따져 보는 중",
			"stage_writing_up": "비평을 작성하는 중",
			"wait_figma": "Figma 파일을 열고 프레임을 나열하는 중…",
			"wait_local": "코드에서 경로를 스캔하는 중…",
			"wait_repo": "저장소를 클론하고 경로를 나열하는 중…",
			"wait_url": "페이지를 불러오고 링크를 따라가는 중…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "비평이 아직 실행 중입니다 — 클릭해서 지켜보세요",
			"across_the_flow": "플로 전반",
			"click_to_enlarge": "클릭하여 확대",
			"close_esc": "닫기 (Esc)",
			"couldn_t_see": "볼 수 없었던 것",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "이것이 무엇인지 알 수 없습니다. Figma 링크, GitHub/GitLab/Bitbucket 저장소, 절대 로컬 경로 또는 이미 서비스 중인 URL을 알려주세요.",
			"critique_ready": "비평 완료",
			"critique_untitled": "비평",
			"design_critique": "Design Critique",
			"enlarge": "확대",
			"full_size": "실제 크기",
			"full_size_view": "실제 크기로 보기",
			"history_count": "기록 ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "들어가긴 했는데, 그 안에 제가 렌더링할 수 있는 게 없네요. 대신 스크린샷을 드롭해 주세요.",
			"new": "새로 만들기",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "표시할 화면이 없습니다 — 이 항목의 픽셀을 가져오지 못했습니다. 패널의 ‘볼 수 없었던 것’을 확인하세요.",
			"nothing_major": "큰 문제 없음",
			"numbered_pins_mark_issues_on_this_screen": "번호 핀은 이 화면의 문제를 표시합니다",
			"on_screen": "● 화면 내",
			"only_added_the_first_room_the_limit_is_max_screens": "처음 {{room}}장만 추가했습니다 — 상한은 {{max}}장입니다.",
			"pick_a_step_above": "위에서 단계를 선택하세요",
			"point_me_at_a_running_url": "실행 중인 URL 알려 주기",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "화면 하나, 또는 플로 전체를 알려 주세요 — 디자이너 친구처럼 읽어 드립니다. 잘 되고 있는 점, 다듬을 점, 그리고 그 이유까지.",
			"running": "실행 중",
			"screen_heading": "화면",
			"screens_in_order": "순서대로 본 화면",
			"see_an_example": "예시 보기",
			"send_screenshots": "스크린샷 보내기",
			"show_this_screen": "이 화면 표시",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "새 비평 시작 — 이미 실행 중인 작업은 계속됩니다",
			"step_n": "{{n}}단계",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "비평 전환",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "스크린 상한인 {{max}}장에 도달했습니다.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "다듬을 점",
			"what_s_working": "잘 되고 있는 점",
			"what_you_ll_get": "받게 될 내용",
			"your_critiques": "내 비평",
			"your_question_click_to_see_the_answer": "내 질문 — 클릭하면 답변이 표시됩니다",
			"rail_uploading": "업로드 중…",
			"rail_reading": "디자인을 읽는 중…",
			"rail_flow_other": "화면 {{n}}개의 흐름 — 화면 사이의 전환도 확인합니다.",
			"rail_one_screen": "화면 1개.",
			"rail_pending_figma": "Figma 파일 — 판단하기 전에 렌더링하는 중입니다.",
			"rail_pending_repo": "저장소 — 판단하기 전에 렌더링하는 중입니다.",
			"rail_pending_local": "로컬 코드 — 판단하기 전에 렌더링하는 중입니다.",
			"rail_pending_url": "실행 중인 앱 — 판단하기 전에 렌더링하는 중입니다.",
			"rail_pending_design": "디자인 — 판단하기 전에 렌더링하는 중입니다.",
			"rail_getting_ready": "화면을 준비하는 중입니다.",
			"critique_ready_fallback": "비평 준비됨",
			"ask_too_long": "너무 오래 걸렸습니다 — 다시 물어보세요.",
			"ask_went_wrong": "문제가 발생했습니다.",
			"entry_meta_screens_other": "화면 {{n}}개 · {{when}}",
			"findings_count_other": "지적 {{n}}건",
			"nothing_flagged": "지적 없음",
			"design_critique_fallback": "디자인 비평",
			"flow_screens_count_other": "화면 {{n}}개",
			"screen_n": "화면 {{n}}",
			"get_overall_read": "전반적인 상태에 대한 평가",
			"get_whats_working": "잘 되는 점 (다음 수정에서도 살리도록)",
			"get_top_things": "다듬을 주요 사항 (화면에 핀 표시)",
			"no_critiques_narrow": "아직 비평이 없습니다. 아래에 스크린샷을 놓으세요.",
			"no_critiques_wide": "아직 비평이 없습니다. 패널에 스크린샷을 놓으세요 →",
			"the_design_alt": "디자인"
		},
		findingRow: {
			"based_on": "근거",
			"finding": "발견 사항",
			"fix": "수정 방법",
			"suggestion": "제안",
			"what_i_saw": "본 내용",
			"where": "위치",
			"steps_range": "{{range}}단계",
			"flow_badge": "흐름"
		},
		manifest: {
			"use_case_1": "화면 하나 또는 전체 제품 흐름을 보이는 영역과 연결된 심각도순 휴리스틱 기반 결과로 검토합니다.",
			"configuration_1": "스크린샷을 놓으면 별도 설정 없이 검토할 수 있습니다. Figma 파일, 저장소, 로컬 폴더 또는 이미 실행 중인 URL도 제공할 수 있습니다. 비공개 GitHub 소스에는 gh auth login이 필요할 수 있습니다.",
			"description": "동료에게 물어보기 전에 먼저 돌려 볼 수 있는 디자인 비평입니다. 스크린샷 하나, 여러 화면으로 이어지는 플로 전체, Figma 파일, git 저장소, 또는 이미 서비스 중인 URL을 주면 후보 화면을 찾아내고 무엇을 볼지 고르게 한 다음, 경험 많은 디자이너처럼 보고합니다. 전체 인상, 잘 되고 있는 점, 그리고 다듬을 만한 지점을 각각 이름이 명시된 휴리스틱과 연결해 제시합니다. 여러 화면으로 된 플로에서는 화면 하나만으로는 드러나지 않는 문제 — 일관성 없는 컨트롤, 진행 표시 누락, 되돌아갈 방법 없음, 막다른 길 — 도 함께 찾아냅니다. 코드와 Figma는 판단하기 전에 렌더링하므로 실제로 보지 않은 화면을 비평하지 않으며, 접근하지 못한 화면은 추측하지 않고 그대로 밝힙니다.",
			"display_name": "Design Critique",
			"highlight_1": "스크린샷, Figma 링크, git 저장소, 로컬 폴더, 실행 중인 URL을 받아 — 시작하기 전에 무엇을 찾았는지 알려 줍니다",
			"highlight_2": "이미지로 추정하지 않고 렌더링된 페이지에서 실제 대비와 터치 영역 크기를 측정합니다",
			"highlight_3": "여러 화면 플로에는 화면 간 점검이 추가됩니다: 컨트롤 일관성, 진행 표시, 되돌아갈 방법, 반복 요청, 막다른 길",
			"highlight_4": "모든 검토 결과가 근거 휴리스틱(Nielsen 1-10, WCAG, Gestalt, Fitts)을 밝히고 NN/g 1-4 척도의 심각도를 함께 표시합니다",
			"highlight_5": "보고서의 어느 줄이든 선택해 그 자리에서 추가 질문을 할 수 있습니다",
			"highlight_6": "비어 있거나 막힌 화면을 비평하는 대신 무엇을 볼 수 없었는지 알려 줍니다",
			"highlight_7": "검토 대상에는 손대지 않습니다: 해당 프로젝트의 의존성을 설치하거나, 스크립트를 실행하거나, 개발 서버를 띄우거나, 파일을 편집하지 않습니다",
			"highlight_8": "화면을 찍을 때 헤드리스 브라우저를 사용하며, 처음 사용할 때 홈 디렉터리의 캐시에 한 번만 내려받고 프로젝트에는 내려받지 않습니다",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_other": "이 플로 비평 · 화면 {{count}}개",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "끌어서 순서 변경",
			"move_earlier": "앞으로 이동",
			"move_later": "뒤로 이동",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "간단한 설명(선택): 대상은 누구이고 주요 과업은 무엇인가요?",
			"optional_who_is_it_for_and_what_s_the_main_task": "선택 사항: 대상은 누구이고 주요 과업은 무엇인가요?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "화면",
			"start_over": "처음부터 다시",
			"suggested_flows": "제안된 플로",
			"what_should_i_audit": "무엇을 점검할까요?",
			"screens_found_count_other": "화면 {{n}}개 발견 · 렌더링 가능 {{m}}개",
			"flow_n": "흐름 {{n}}",
			"picked_count_other": "{{n}}개 선택됨",
			"hint_order": "숫자는 확인할 순서입니다 — 행을 끌어 순서를 바꾸거나 키보드의 ‹ ›를 사용하세요.",
			"hint_pick": "화면을 클릭해 선택하세요. 여러 개를 고르면 흐름으로 비평합니다.",
			"cant_render_title": "이 화면은 렌더링할 수 없습니다",
			"cant_render_short": "렌더링 불가",
			"group_fallback": "화면",
			"tag_from_links": "링크 기반",
			"tag_guess": "추측"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "캡처해서 실제 대비와 크기를 측정합니다.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "복제해서 화면 목록을 만듭니다. 서버 없이 렌더링되는 페이지만 볼 수 있습니다.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "화면 목록을 만듭니다. 서버 없이 렌더링되는 페이지만 볼 수 있습니다.",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "지금 실행 중이어야 합니다. 실시간으로 캡처해서 실제 대비와 크기를 측정합니다.",
			"not_something_i_recognise_give_me_a_figma_link_a": "인식할 수 없습니다. Figma 링크, GitHub 저장소, 로컬 절대 경로 또는 이미 서비스 중인 URL을 알려 주세요.",
			"screen_fallback": "화면"
		},
		waitingScreen: {
			"cancel_this_run": "이 실행 취소",
			"stop_this_run_and_discard_it": "이 실행을 중지하고 버리기",
			"getting_screens_ready": "화면을 준비하는 중…",
			"title_scanning": "점검할 화면을 찾는 중",
			"title_uploading_screens_other": "화면 {{n}}개 업로드 중…",
			"title_uploading_one": "스크린샷 업로드 중…",
			"title_reading_flow_other": "흐름 읽는 중 · 화면 {{n}}개",
			"title_reading_screen": "화면 읽는 중",
			"title_getting_pixels": "먼저 실제 픽셀을 가져오는 중",
			"foot_still_going": "아직 진행 중입니다 — 화면이 많은 흐름은 몇 분 걸릴 수 있습니다. 이 페이지를 떠나도 비평은 계속되며, 돌아오면 여기에 있습니다.",
			"foot_navigate_away": "이 페이지를 떠나도 비평은 계속됩니다."
		},
		common: {
			"send_failed": "전송 실패",
			"unexpected_server_response": "예기치 않은 서버 응답"
		}
	},
	pt: {
		askLayer: {
			"answer_failed_ask_again_below": "A resposta falhou — pergunte de novo abaixo",
			"ask_a_follow_up": "Faça outra pergunta…",
			"ask_again": "Pergunte de novo…",
			"what_dont_you_understand_about_this": "O que você não entende aqui?",
			"ask": "Perguntar",
			"ask_about_this": "Perguntar sobre isto",
			"close": "Fechar",
			"remove_this_annotation": "Remover esta anotação",
			"thinking": "Pensando…",
			"question_label": "Sua pergunta sobre esta crítica"
		},
		composer: {
			"add_screens": "Adicionar telas",
			"add_screenshots_or_paste_a_link_first": "Primeiro adicione capturas de tela ou cole um link",
			"clear_all": "Limpar tudo",
			"critique_this_flow_count_screens_one": "Criticar este fluxo · {{count}} tela",
			"critique_this_flow_count_screens_many": "Criticar este fluxo · {{count}} telas",
			"critique_this_flow_count_screens_other": "Criticar este fluxo · {{count}} telas",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Solte as capturas de tela — ou clique para procurar",
			"fix_my_access": "Corrigir meu acesso",
			"fix_the_link": "Corrigir o link",
			"hide_access_steps": "Ocultar as etapas de acesso",
			"move_earlier": "Mover antes",
			"move_later": "Mover depois",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "uma tela, ou várias em ordem para um fluxo · PNG, JPG, WebP",
			"remove": "Remover",
			"remove_name": "Remover {{name}}",
			"send_screenshots": "Enviar capturas de tela",
			"start_the_critique": "Iniciar a crítica",
			"step_n": "Etapa {{n}}",
			"try_again": "Tentar de novo",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Usar uma pasta local",
			"start_kind_figma": "Criticar o arquivo do Figma",
			"start_kind_repo": "Criticar o repositório",
			"start_kind_local": "Criticar o código local",
			"start_kind_url": "Criticar o app em execução",
			"start_this": "Criticar isto",
			"start_plain": "Criticar",
			"staged_one_hint": "1 tela · adicione outra para criticá-las como um fluxo.",
			"staged_flow_hint_one": "{{n}} tela · esta ordem é a ordem do fluxo — reordene ou remova antes de começar.",
			"staged_flow_hint_many": "{{n}} telas · esta ordem é a ordem do fluxo — reordene ou remova antes de começar.",
			"staged_flow_hint_other": "{{n}} telas · esta ordem é a ordem do fluxo — reordene ou remova antes de começar.",
			"title_blocked": "Não consegui entrar",
			"title_ask": "O que devo criticar?",
			"link_placeholder_staged": "Usando suas capturas — remova-as para criticar um link",
			"link_placeholder": "Link do Figma · repositório git · uma pasta nesta máquina · uma URL em execução (localhost ou uma prévia implantada)",
			"link_label": "Link para criticar",
			"render_before_judging": "Renderizo tudo antes de julgar — nunca só pelo código. Se o seu app já estiver em execução, cole a URL e poderei medir cores e tamanhos reais em vez de estimá-los."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Abra o arquivo no Figma para desktop e tente novamente, ou exporte os frames como PNGs e solte-os aqui.",
			"blocked_figma_app_missing_say": "Não consigo acessar o Figma — o app para desktop não está em execução, ou não tenho as ferramentas do Figma disponíveis.",
			"blocked_figma_export_needed_hint": "Exporte cada frame como PNG e solte-os aqui como capturas — de qualquer forma eu critico os pixels.",
			"blocked_figma_export_needed_say": "Não consigo puxar os frames direto de um link do Figma aqui — não tenho as ferramentas de desktop do Figma.",
			"blocked_figma_file_closed_hint": "Abra-o no Figma para desktop e tente novamente.",
			"blocked_figma_file_closed_say": "O Figma está em execução, mas esse arquivo não está aberto.",
			"blocked_figma_no_permission_auth_lead": "O acesso ao Figma é por conta, e eu leio o que o app para desktop tiver aberto — não tenho login próprio. Veja como resolver isso.",
			"blocked_figma_no_permission_auth_step_1": "1. Peça ao proprietário do arquivo para compartilhá-lo com a sua conta do Figma",
			"blocked_figma_no_permission_auth_step_2": "2. Abra-o no Figma para desktop",
			"blocked_figma_no_permission_auth_step_3": "3. Volte aqui e clique em Tentar novamente",
			"blocked_figma_no_permission_auth_tail": "Se o acesso não vier, exportar os frames como PNGs funciona igualmente bem — eu critico pixels de qualquer forma.",
			"blocked_figma_no_permission_hint": "Peça acesso, ou exporte os frames como PNGs e solte-os aqui.",
			"blocked_figma_no_permission_say": "A sua conta do Figma não pode ver esse arquivo.",
			"blocked_no_access_hint": "Se você já tem o repositório clonado, me passe o caminho da pasta.",
			"blocked_no_access_say": "Não consegui abrir esse repositório. Ele é privado (e eu não tenho credenciais para ele) ou não existe — o GitHub retorna o mesmo erro nos dois casos.",
			"blocked_not_found_hint": "Confira o proprietário e o nome, ou me passe o caminho de uma pasta local.",
			"blocked_not_found_say": "Esse repositório não existe nessa URL.",
			"blocked_other_hint": "Capturas de tela são o jeito mais rápido de contornar isso.",
			"blocked_other_say": "Não consegui acessar isso.",
			"kind_figma": "arquivo do Figma",
			"kind_local": "código local",
			"kind_repo": "repositório",
			"kind_url": "app em execução",
			"scan_finding_screens": "Encontrando as telas",
			"scan_grouping_flows": "Agrupando-as em fluxos prováveis",
			"scan_which_renderable": "Descobrindo quais delas consigo renderizar",
			"sev_catastrophe": "Catástrofe",
			"sev_cosmetic": "Cosmético",
			"sev_major": "Grave",
			"sev_minor": "Leve",
			"stage_checking_hierarchy": "Verificando hierarquia, contraste e conteúdo",
			"stage_double_checking": "Conferindo cada descoberta",
			"stage_getting_pixels": "Obtendo pixels reais para analisar",
			"stage_reading_screens": "Lendo as telas",
			"stage_weighing_task": "Avaliando isso em relação à tarefa",
			"stage_writing_up": "Escrevendo a crítica",
			"wait_figma": "Abrindo o arquivo do Figma e listando os frames dele…",
			"wait_local": "Analisando o código em busca de rotas…",
			"wait_repo": "Clonando o repositório e listando as rotas dele…",
			"wait_url": "Carregando a página e seguindo os links dela…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Uma crítica ainda está em andamento — clique para acompanhar",
			"across_the_flow": "Ao longo do fluxo",
			"click_to_enlarge": "Clique para ampliar",
			"close_esc": "Fechar (Esc)",
			"couldn_t_see": "Não consegui ver",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "Não consegui identificar o que é isso. Envie um link do Figma, um repositório GitHub/GitLab/Bitbucket, um caminho local absoluto ou uma URL que já esteja em execução.",
			"critique_ready": "crítica pronta",
			"critique_untitled": "Crítica",
			"design_critique": "Design Critique",
			"enlarge": "Ampliar",
			"full_size": "tamanho real",
			"full_size_view": "Visualização em tamanho real",
			"history_count": "Histórico ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Entrei, mas não há nada lá dentro que eu consiga renderizar. Melhor me mandar capturas de tela.",
			"new": "Nova",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "Nenhuma tela para mostrar — não foi possível capturar os pixels desta. Veja \"Não consegui ver\" no painel.",
			"nothing_major": "nada grave",
			"numbered_pins_mark_issues_on_this_screen": "os marcadores numerados indicam problemas nesta tela",
			"on_screen": "● na tela",
			"only_added_the_first_room_the_limit_is_max_screens": "Só as primeiras {{room}} foram adicionadas — o limite é de {{max}} telas.",
			"pick_a_step_above": "escolha uma etapa acima",
			"point_me_at_a_running_url": "Aponte para uma URL em execução",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Me mostre uma tela — ou um fluxo inteiro — e eu vou analisá-lo como um amigo designer faria: o que está funcionando, o que ajustar e por quê.",
			"running": "em andamento",
			"screen_heading": "Tela",
			"screens_in_order": "Telas em ordem",
			"see_an_example": "Ver um exemplo",
			"send_screenshots": "Enviar capturas de tela",
			"show_this_screen": "Mostrar esta tela",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Iniciar uma nova crítica — o que já estiver em andamento continua",
			"step_n": "Etapa {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Ainda estou trabalhando nisso. A análise continua em execução — volte em um minuto.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Ainda estou trabalhando nisso. A análise continua em execução — volte a esta página em um minuto e ela retomará de onde parou.",
			"switch_critique": "Trocar de crítica",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "São mais de 20 telas — envie menos.",
			"that_s_the_limit_of_max_screens": "Esse é o limite de {{max}} telas.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "O que eu ajustaria",
			"what_s_working": "O que está funcionando",
			"what_you_ll_get": "O que você vai receber",
			"your_critiques": "Suas críticas",
			"your_question_click_to_see_the_answer": "Sua pergunta — clique para ver a resposta",
			"rail_uploading": "Enviando…",
			"rail_reading": "Lendo o seu design…",
			"rail_flow_one": "Um fluxo de {{n}} tela — também vou verificar as transições entre elas.",
			"rail_flow_many": "Um fluxo de {{n}} telas — também vou verificar as transições entre elas.",
			"rail_flow_other": "Um fluxo de {{n}} telas — também vou verificar as transições entre elas.",
			"rail_one_screen": "Uma tela.",
			"rail_pending_figma": "Um arquivo do Figma — renderizando antes de julgar.",
			"rail_pending_repo": "Um repositório — renderizando antes de julgar.",
			"rail_pending_local": "Código local — renderizando antes de julgar.",
			"rail_pending_url": "Um app em execução — renderizando antes de julgar.",
			"rail_pending_design": "Um design — renderizando antes de julgar.",
			"rail_getting_ready": "Preparando as telas.",
			"critique_ready_fallback": "Crítica pronta",
			"ask_too_long": "Demorou demais — pergunte de novo.",
			"ask_went_wrong": "Algo deu errado.",
			"entry_meta_screens_one": "{{n}} tela · {{when}}",
			"entry_meta_screens_many": "{{n}} telas · {{when}}",
			"entry_meta_screens_other": "{{n}} telas · {{when}}",
			"findings_count_one": "{{n}} apontamento",
			"findings_count_many": "{{n}} apontamentos",
			"findings_count_other": "{{n}} apontamentos",
			"nothing_flagged": "nada sinalizado",
			"design_critique_fallback": "Crítica de design",
			"flow_screens_count_one": "{{n}} tela",
			"flow_screens_count_many": "{{n}} telas",
			"flow_screens_count_other": "{{n}} telas",
			"screen_n": "Tela {{n}}",
			"get_overall_read": "Uma leitura geral de como está indo",
			"get_whats_working": "O que funciona, para sobreviver à próxima rodada",
			"get_top_things": "Os principais pontos a ajustar, com marcadores na tela",
			"no_critiques_narrow": "Nenhuma crítica ainda. Solte uma captura abaixo.",
			"no_critiques_wide": "Nenhuma crítica ainda. Solte uma captura no painel →",
			"the_design_alt": "O design"
		},
		findingRow: {
			"based_on": "Com base em",
			"finding": "Achado",
			"fix": "Correção",
			"suggestion": "Sugestão",
			"what_i_saw": "O que eu vi",
			"where": "Onde",
			"steps_range": "etapas {{range}}",
			"flow_badge": "fluxo"
		},
		manifest: {
			"description": "Uma crítica de design que você pode rodar antes de pedir a um colega. Dê a ele uma captura de tela, um fluxo inteiro de várias telas, um arquivo do Figma, um repositório git ou uma URL que já esteja servindo, e ele encontra as telas candidatas, deixa você escolher o que examinar e responde como faria um designer experiente: uma leitura geral, o que está funcionando e os pontos que valem um ajuste, cada um ligado a uma heurística nomeada. Fluxos de várias telas também recebem descobertas entre telas que uma tela isolada não revela — controles inconsistentes, falta de indicação de progresso, nenhum caminho de volta, becos sem saída. Ele renderiza código e Figma antes de julgá-los, então nunca critica um visual que não viu de fato, e diz claramente a quais telas não conseguiu chegar, em vez de adivinhar.",
			"display_name": "Design Critique",
			"highlight_1": "Aceita capturas de tela, um link do Figma, um repositório git, uma pasta local ou uma URL em execução — e informa o que encontrou antes de começar",
			"highlight_2": "Mede o contraste e o tamanho das áreas de toque na página renderizada, em vez de estimá-los a partir de uma imagem",
			"highlight_3": "Fluxos de várias telas recebem verificações entre telas: consistência dos controles, progresso, caminho de volta, pedidos repetidos, becos sem saída",
			"highlight_4": "Cada descoberta nomeia a heurística por trás dela (Nielsen 1-10, WCAG, Gestalt, Fitts) e traz uma severidade na escala NN/g 1-4",
			"highlight_5": "Selecione qualquer linha do relatório e faça uma pergunta de acompanhamento sobre ela, ali mesmo",
			"highlight_6": "Diz o que não conseguiu ver, em vez de criticar uma tela em branco ou bloqueada",
			"highlight_7": "Não mexe no projeto que revisa: nunca instala as dependências dele, executa os seus scripts, inicia o seu servidor de desenvolvimento nem edita os seus arquivos",
			"highlight_8": "Para capturar imagens, usa um navegador headless, baixado uma única vez para um cache no seu diretório pessoal no primeiro uso e nunca dentro do projeto",
			"page_label": "Design Critique",
			"use_case_1": "Avalie uma tela ou um fluxo de produto completo com descobertas classificadas por gravidade, baseadas em heurísticas e ligadas às regiões visíveis.",
			"configuration_1": "Adicione capturas de tela para uma análise sem configuração ou forneça um arquivo do Figma, repositório, pasta local ou URL já em execução; fontes privadas do GitHub podem exigir gh auth login."
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Criticar este fluxo · {{count}} tela",
			"critique_this_flow_count_screens_many": "Criticar este fluxo · {{count}} telas",
			"critique_this_flow_count_screens_other": "Criticar este fluxo · {{count}} telas",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Arraste para reordenar",
			"move_earlier": "Mover antes",
			"move_later": "Mover depois",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Brief opcional: para quem é e qual é a tarefa principal?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Opcional: para quem é e qual é a tarefa principal?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Telas",
			"start_over": "Começar de novo",
			"suggested_flows": "Fluxos sugeridos",
			"what_should_i_audit": "O que devo analisar?",
			"screens_found_count_one": "{{n}} tela encontrada · {{m}} que consigo renderizar",
			"screens_found_count_many": "{{n}} telas encontradas · {{m}} que consigo renderizar",
			"screens_found_count_other": "{{n}} telas encontradas · {{m}} que consigo renderizar",
			"flow_n": "Fluxo {{n}}",
			"picked_count_one": "{{n}} escolhida",
			"picked_count_many": "{{n}} escolhidas",
			"picked_count_other": "{{n}} escolhidas",
			"hint_order": "Os números são a ordem em que vou percorrê-las — arraste uma linha para reordenar ou use ‹ › no teclado.",
			"hint_pick": "Clique em uma tela para escolhê-la. Escolha várias para criticá-las como um fluxo.",
			"cant_render_title": "Não consigo renderizar esta",
			"cant_render_short": "não renderiza",
			"group_fallback": "Telas",
			"tag_from_links": "Pelos links",
			"tag_guess": "Palpite"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "Vou capturá-la e medir contraste e tamanhos reais.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Vou cloná-lo e listar as telas. Só aparecem as páginas que renderizam sem servidor.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Vou listar as telas. Só aparecem as páginas que renderizam sem servidor.",
			"i_ll_pull_the_frames": "Vou buscar os frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "ela precisa estar em execução agora. Vou capturá-la ao vivo e medir contraste e tamanhos reais.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Não reconheço isso. Envie um link do Figma, um repositório do GitHub, um caminho local absoluto ou uma URL que já esteja no ar.",
			"screen_fallback": "Tela"
		},
		waitingScreen: {
			"cancel_this_run": "Cancelar esta execução",
			"stop_this_run_and_discard_it": "Parar esta execução e descartá-la",
			"getting_screens_ready": "Preparando as telas…",
			"title_scanning": "Procurando telas para analisar",
			"title_uploading_screens_one": "Enviando {{n}} tela…",
			"title_uploading_screens_many": "Enviando {{n}} telas…",
			"title_uploading_screens_other": "Enviando {{n}} telas…",
			"title_uploading_one": "Enviando sua captura…",
			"title_reading_flow_one": "Lendo seu fluxo · {{n}} tela",
			"title_reading_flow_many": "Lendo seu fluxo · {{n}} telas",
			"title_reading_flow_other": "Lendo seu fluxo · {{n}} telas",
			"title_reading_screen": "Lendo sua tela",
			"title_getting_pixels": "Primeiro, pixels reais",
			"foot_still_going": "Ainda em andamento — um fluxo denso pode levar alguns minutos. Você pode sair desta página; a crítica continua e estará aqui quando você voltar.",
			"foot_navigate_away": "Você pode sair desta página — a crítica continua."
		},
		common: {
			"send_failed": "Falha no envio",
			"unexpected_server_response": "Resposta inesperada do servidor"
		}
	},
	ru: {
		askLayer: {
			"answer_failed_ask_again_below": "Не удалось ответить — спроси ещё раз ниже",
			"ask_a_follow_up": "Задай ещё вопрос…",
			"ask_again": "Спроси ещё раз…",
			"what_dont_you_understand_about_this": "Что здесь непонятно?",
			"ask": "Спросить",
			"ask_about_this": "Спросить об этом",
			"close": "Закрыть",
			"remove_this_annotation": "Удалить эту пометку",
			"thinking": "Думаю…",
			"question_label": "Твой вопрос об этом разборе"
		},
		composer: {
			"add_screens": "Добавить экраны",
			"add_screenshots_or_paste_a_link_first": "Сначала добавь скриншоты или вставь ссылку",
			"clear_all": "Очистить всё",
			"critique_this_flow_count_screens_one": "Разобрать этот сценарий · {{count}} экран",
			"critique_this_flow_count_screens_few": "Разобрать этот сценарий · {{count}} экрана",
			"critique_this_flow_count_screens_many": "Разобрать этот сценарий · {{count}} экранов",
			"critique_this_flow_count_screens_other": "Разобрать этот сценарий · {{count}} экрана",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "Перетащите скриншоты — или нажмите для выбора",
			"fix_my_access": "Исправить доступ",
			"fix_the_link": "Исправить ссылку",
			"hide_access_steps": "Скрыть шаги доступа",
			"move_earlier": "Переместить раньше",
			"move_later": "Переместить позже",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "один экран или несколько по порядку для сценария · PNG, JPG, WebP",
			"remove": "Удалить",
			"remove_name": "Удалить {{name}}",
			"send_screenshots": "Отправить скриншоты",
			"start_the_critique": "Начать разбор",
			"step_n": "Шаг {{n}}",
			"try_again": "Повторить",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "Использовать локальную папку",
			"start_kind_figma": "Разобрать файл Figma",
			"start_kind_repo": "Разобрать репозиторий",
			"start_kind_local": "Разобрать локальный код",
			"start_kind_url": "Разобрать запущенное приложение",
			"start_this": "Разобрать это",
			"start_plain": "Разобрать",
			"staged_one_hint": "1 экран · добавь ещё один, чтобы разобрать их как сценарий.",
			"staged_flow_hint_one": "{{n}} экран · это порядок сценария — переставь или удали перед началом.",
			"staged_flow_hint_few": "{{n}} экрана · это порядок сценария — переставь или удали перед началом.",
			"staged_flow_hint_many": "{{n}} экранов · это порядок сценария — переставь или удали перед началом.",
			"staged_flow_hint_other": "{{n}} экрана · это порядок сценария — переставь или удали перед началом.",
			"title_blocked": "Мне не удалось войти",
			"title_ask": "Что разобрать?",
			"link_placeholder_staged": "Используются твои скриншоты — убери их, чтобы разобрать ссылку",
			"link_placeholder": "Ссылка Figma · git-репозиторий · папка на этом компьютере · запущенный URL (localhost или развёрнутый предпросмотр)",
			"link_label": "Ссылка для разбора",
			"render_before_judging": "Я отрисовываю всё, прежде чем оценивать, — никогда не только по коду. Если твоё приложение уже запущено, вставь его URL, и я смогу измерить настоящие цвета и размеры, а не прикидывать их."
		},
		constants: {
			"blocked_figma_app_missing_hint": "Открой файл в настольном приложении Figma и попробуй снова, или экспортируй фреймы в PNG и перетащи их сюда.",
			"blocked_figma_app_missing_say": "Не могу подключиться к Figma — настольное приложение не запущено или у меня нет инструментов Figma.",
			"blocked_figma_export_needed_hint": "Экспортируй каждый фрейм в PNG и закинь их сюда как скриншоты — пиксели я всё равно разберу.",
			"blocked_figma_export_needed_say": "Я не могу вытянуть фреймы прямо из ссылки Figma здесь — у меня нет десктопных инструментов Figma.",
			"blocked_figma_file_closed_hint": "Открой его в настольном приложении Figma и попробуй снова.",
			"blocked_figma_file_closed_say": "Figma запущена, но этот файл не открыт.",
			"blocked_figma_no_permission_auth_lead": "Доступ к Figma привязан к аккаунту, а я читаю то, что открыто в настольном приложении, — своей учётной записи у меня нет. Вот как это исправить.",
			"blocked_figma_no_permission_auth_step_1": "1. Попроси владельца файла открыть к нему доступ для твоего аккаунта Figma",
			"blocked_figma_no_permission_auth_step_2": "2. Открой его в настольном приложении Figma",
			"blocked_figma_no_permission_auth_step_3": "3. Вернись и нажми «Повторить»",
			"blocked_figma_no_permission_auth_tail": "Если доступа не будет, экспорт фреймов в PNG сработает не хуже — я всё равно разбираю пиксели.",
			"blocked_figma_no_permission_hint": "Запроси доступ или экспортируй фреймы в PNG и перетащи их сюда.",
			"blocked_figma_no_permission_say": "Твой аккаунт Figma не может открыть этот файл.",
			"blocked_no_access_hint": "Если он у тебя уже склонирован, просто укажи путь к папке.",
			"blocked_no_access_say": "Не удалось открыть этот репозиторий. Он либо приватный (а у меня нет учётных данных), либо не существует — GitHub возвращает одну и ту же ошибку в обоих случаях.",
			"blocked_not_found_hint": "Проверь владельца и название или укажи путь к локальной папке.",
			"blocked_not_found_say": "По этому URL репозитория нет.",
			"blocked_other_hint": "Быстрее всего обойти это скриншотами.",
			"blocked_other_say": "Не удалось туда попасть.",
			"kind_figma": "файл Figma",
			"kind_local": "локальный код",
			"kind_repo": "репозиторий",
			"kind_url": "запущенное приложение",
			"scan_finding_screens": "Ищу экраны",
			"scan_grouping_flows": "Группирую их в вероятные сценарии",
			"scan_which_renderable": "Определяю, какие из них смогу отрисовать",
			"sev_catastrophe": "Катастрофа",
			"sev_cosmetic": "Косметическая",
			"sev_major": "Серьёзная",
			"sev_minor": "Незначительная",
			"stage_checking_hierarchy": "Проверяю иерархию, контраст и содержание",
			"stage_double_checking": "Перепроверяю каждый вывод",
			"stage_getting_pixels": "Получаю настоящие пиксели, чтобы посмотреть",
			"stage_reading_screens": "Читаю экраны",
			"stage_weighing_task": "Сопоставляю это с задачей",
			"stage_writing_up": "Пишу разбор",
			"wait_figma": "Открываю файл Figma и перечисляю его фреймы...",
			"wait_local": "Ищу маршруты в коде...",
			"wait_repo": "Клонирую репозиторий и перечисляю его маршруты...",
			"wait_url": "Загружаю страницу и перехожу по её ссылкам..."
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "Разбор ещё выполняется — нажмите, чтобы посмотреть",
			"across_the_flow": "По всему сценарию",
			"click_to_enlarge": "Нажми, чтобы увеличить",
			"close_esc": "Закрыть (Esc)",
			"couldn_t_see": "Не удалось увидеть",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "Не удалось понять, что это. Дайте ссылку на Figma, репозиторий GitHub/GitLab/Bitbucket, абсолютный локальный путь или уже работающий URL.",
			"critique_ready": "разбор готов",
			"critique_untitled": "Разбор",
			"design_critique": "Design Critique",
			"enlarge": "Увеличить",
			"full_size": "полный размер",
			"full_size_view": "Просмотр в полном размере",
			"history_count": "История ({{n}})",
			"i_got_in_but_there_s_nothing_in_there_i_can": "Я зашёл, но там нет ничего, что я мог бы отрисовать. Лучше закинь скриншоты.",
			"new": "Новый",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "Нет экранов для показа — критик не получил пиксели для этого. См. «Не удалось увидеть» на панели.",
			"nothing_major": "ничего серьёзного",
			"numbered_pins_mark_issues_on_this_screen": "пронумерованные метки отмечают проблемы на этом экране",
			"on_screen": "● на экране",
			"only_added_the_first_room_the_limit_is_max_screens": "Добавлены только первые {{room}} — предел {{max}} экранов.",
			"pick_a_step_above": "выбери шаг выше",
			"point_me_at_a_running_url": "Укажите работающий URL",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "Укажите экран — или целый сценарий — и я разберу его как друг-дизайнер: что работает, что стоит доработать и почему.",
			"running": "выполняется",
			"screen_heading": "Экран",
			"screens_in_order": "Экраны по порядку",
			"see_an_example": "Посмотреть пример",
			"send_screenshots": "Отправить скриншоты",
			"show_this_screen": "Показать этот экран",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "Начать новый разбор — уже запущенные продолжат работу",
			"step_n": "Шаг {{n}}",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "Переключить разбор",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "Это предел — {{max}} экранов.",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "Что стоит доработать",
			"what_s_working": "Что работает",
			"what_you_ll_get": "Что вы получите",
			"your_critiques": "Ваши разборы",
			"your_question_click_to_see_the_answer": "Ваш вопрос — нажмите, чтобы увидеть ответ",
			"rail_uploading": "Загрузка…",
			"rail_reading": "Читаю твой дизайн…",
			"rail_flow_one": "Сценарий из {{n}} экрана — проверю и переходы между ними.",
			"rail_flow_few": "Сценарий из {{n}} экранов — проверю и переходы между ними.",
			"rail_flow_many": "Сценарий из {{n}} экранов — проверю и переходы между ними.",
			"rail_flow_other": "Сценарий из {{n}} экрана — проверю и переходы между ними.",
			"rail_one_screen": "Один экран.",
			"rail_pending_figma": "Файл Figma — отрисовываю, прежде чем оценивать.",
			"rail_pending_repo": "Репозиторий — отрисовываю, прежде чем оценивать.",
			"rail_pending_local": "Локальный код — отрисовываю, прежде чем оценивать.",
			"rail_pending_url": "Запущенное приложение — отрисовываю, прежде чем оценивать.",
			"rail_pending_design": "Дизайн — отрисовываю, прежде чем оценивать.",
			"rail_getting_ready": "Готовлю экраны.",
			"critique_ready_fallback": "Разбор готов",
			"ask_too_long": "Слишком долго — спроси ещё раз.",
			"ask_went_wrong": "Что-то пошло не так.",
			"entry_meta_screens_one": "{{n}} экран · {{when}}",
			"entry_meta_screens_few": "{{n}} экрана · {{when}}",
			"entry_meta_screens_many": "{{n}} экранов · {{when}}",
			"entry_meta_screens_other": "{{n}} экрана · {{when}}",
			"findings_count_one": "{{n}} замечание",
			"findings_count_few": "{{n}} замечания",
			"findings_count_many": "{{n}} замечаний",
			"findings_count_other": "{{n}} замечания",
			"nothing_flagged": "замечаний нет",
			"design_critique_fallback": "Разбор дизайна",
			"flow_screens_count_one": "{{n}} экран",
			"flow_screens_count_few": "{{n}} экрана",
			"flow_screens_count_many": "{{n}} экранов",
			"flow_screens_count_other": "{{n}} экрана",
			"screen_n": "Экран {{n}}",
			"get_overall_read": "Общая оценка того, как всё выглядит",
			"get_whats_working": "Что работает, чтобы это пережило следующую правку",
			"get_top_things": "Главное, что стоит подтянуть, с метками на экране",
			"no_critiques_narrow": "Разборов пока нет. Перетащи скриншот ниже.",
			"no_critiques_wide": "Разборов пока нет. Перетащи скриншот на панель →",
			"the_design_alt": "дизайн"
		},
		findingRow: {
			"based_on": "На основе",
			"finding": "Замечание",
			"fix": "Исправление",
			"suggestion": "Предложение",
			"what_i_saw": "Что я увидел",
			"where": "Где",
			"steps_range": "шаги {{range}}",
			"flow_badge": "сценарий"
		},
		manifest: {
			"description": "Разбор дизайна, который можно провести до того, как спрашивать коллегу. Дай ему один скриншот, целый многоэкранный сценарий, файл Figma, репозиторий git или уже работающий URL — он найдёт подходящие экраны, даст выбрать, что смотреть, а потом ответит так, как ответил бы опытный дизайнер: общее впечатление, что работает хорошо и что стоит подтянуть, причём каждый пункт привязан к названной эвристике. Для многоэкранных сценариев добавляются межэкранные наблюдения, которых не видно на одном экране — несогласованные элементы управления, отсутствие индикации хода работы, невозможность вернуться, тупики. Код и Figma он сначала отрисовывает и только потом судит, поэтому никогда не критикует то, чего на самом деле не видел, и прямо говорит, до каких экранов не смог добраться, вместо того чтобы догадываться.",
			"display_name": "Design Critique",
			"use_case_1": "Оценивайте один экран или полный сценарий продукта, получая привязанные к видимым областям замечания, ранжированные по серьёзности и подкреплённые эвристиками.",
			"configuration_1": "Перетащите снимки экрана для проверки без настройки либо укажите файл Figma, репозиторий, локальную папку или уже запущенный URL; для закрытых источников GitHub может потребоваться gh auth login.",
			"highlight_1": "Принимает скриншоты, ссылку Figma, репозиторий git, локальную папку или работающий URL — и сообщает, что нашёл, прежде чем начать",
			"highlight_2": "Измеряет контраст и размеры областей нажатия по отрисованной странице, а не оценивает их по картинке",
			"highlight_3": "Для многоэкранных сценариев есть межэкранные проверки: согласованность элементов управления, индикация хода работы, путь назад, повторные запросы, тупики",
			"highlight_4": "У каждого замечания названа эвристика, на которой оно основано (Nielsen 1-10, WCAG, Gestalt, Fitts), и указана серьёзность по шкале NN/g 1-4",
			"highlight_5": "Выдели любую строку отчёта и задай по ней уточняющий вопрос, не уходя со страницы",
			"highlight_6": "Говорит, чего не смог увидеть, вместо того чтобы критиковать пустой или недоступный экран",
			"highlight_7": "Не трогает проверяемый проект: не устанавливает его зависимости, не запускает его скрипты, не поднимает его dev-сервер и не правит его файлы",
			"highlight_8": "Для снимков используется headless-браузер: он один раз скачивается в кэш в домашнем каталоге при первом запуске и никогда — в проект",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_one": "Разобрать этот сценарий · {{count}} экран",
			"critique_this_flow_count_screens_few": "Разобрать этот сценарий · {{count}} экрана",
			"critique_this_flow_count_screens_many": "Разобрать этот сценарий · {{count}} экранов",
			"critique_this_flow_count_screens_other": "Разобрать этот сценарий · {{count}} экрана",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "Перетащите для изменения порядка",
			"move_earlier": "Переместить раньше",
			"move_later": "Переместить позже",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "Необязательное описание: для кого это и какая основная задача?",
			"optional_who_is_it_for_and_what_s_the_main_task": "Необязательно: для кого это и какая основная задача?",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "Экраны",
			"start_over": "Начать заново",
			"suggested_flows": "Предлагаемые сценарии",
			"what_should_i_audit": "Что мне проанализировать?",
			"screens_found_count_one": "Найден {{n}} экран · отрисовать могу {{m}}",
			"screens_found_count_few": "Найдено {{n}} экрана · отрисовать могу {{m}}",
			"screens_found_count_many": "Найдено {{n}} экранов · отрисовать могу {{m}}",
			"screens_found_count_other": "Найдено {{n}} экрана · отрисовать могу {{m}}",
			"flow_n": "Сценарий {{n}}",
			"picked_count_one": "выбран {{n}}",
			"picked_count_few": "выбрано {{n}}",
			"picked_count_many": "выбрано {{n}}",
			"picked_count_other": "выбрано {{n}}",
			"hint_order": "Номера — порядок, в котором я их пройду. Перетащи строку, чтобы изменить порядок, или используй ‹ › с клавиатуры.",
			"hint_pick": "Нажми на экран, чтобы выбрать его. Выбери несколько, чтобы разобрать их как сценарий.",
			"cant_render_title": "Этот я не могу отрисовать",
			"cant_render_short": "не отрисовывается",
			"group_fallback": "Экраны",
			"tag_from_links": "По ссылкам",
			"tag_guess": "Догадка"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "Я сниму его и измерю настоящий контраст и размеры.",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "Я склонирую его и перечислю экраны. Видны только страницы, которые отрисовываются без сервера.",
			"i_ll_list_the_screens_only_pages_that_render_wit": "Я перечислю экраны. Видны только страницы, которые отрисовываются без сервера.",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "оно должно работать прямо сейчас. Я сниму его вживую и измерю настоящий контраст и размеры.",
			"not_something_i_recognise_give_me_a_figma_link_a": "Не узнаю это. Дай ссылку Figma, репозиторий GitHub, абсолютный локальный путь или URL, который уже отвечает.",
			"screen_fallback": "Экран"
		},
		waitingScreen: {
			"cancel_this_run": "Отменить этот запуск",
			"stop_this_run_and_discard_it": "Остановить запуск и отменить его",
			"getting_screens_ready": "Готовлю экраны…",
			"title_scanning": "Ищу экраны для разбора",
			"title_uploading_screens_one": "Загружаю {{n}} экран…",
			"title_uploading_screens_few": "Загружаю {{n}} экрана…",
			"title_uploading_screens_many": "Загружаю {{n}} экранов…",
			"title_uploading_screens_other": "Загружаю {{n}} экрана…",
			"title_uploading_one": "Загружаю твой скриншот…",
			"title_reading_flow_one": "Читаю сценарий · {{n}} экран",
			"title_reading_flow_few": "Читаю сценарий · {{n}} экрана",
			"title_reading_flow_many": "Читаю сценарий · {{n}} экранов",
			"title_reading_flow_other": "Читаю сценарий · {{n}} экрана",
			"title_reading_screen": "Читаю твой экран",
			"title_getting_pixels": "Сначала получаю настоящие пиксели",
			"foot_still_going": "Ещё идёт — плотный сценарий может занять пару минут. Можешь уйти со страницы: разбор продолжится и будет ждать, когда ты вернёшься.",
			"foot_navigate_away": "Можешь уйти со страницы — разбор продолжится."
		},
		common: {
			"send_failed": "Не удалось отправить",
			"unexpected_server_response": "Неожиданный ответ сервера"
		}
	},
	"zh-CN": {
		askLayer: {
			"answer_failed_ask_again_below": "回答失败——在下方重新提问",
			"ask_a_follow_up": "继续提问…",
			"ask_again": "重新提问…",
			"what_dont_you_understand_about_this": "这里哪里看不懂？",
			"ask": "提问",
			"ask_about_this": "就此提问",
			"close": "关闭",
			"remove_this_annotation": "移除此标注",
			"thinking": "思考中…",
			"question_label": "关于此评审的问题"
		},
		composer: {
			"add_screens": "添加界面",
			"add_screenshots_or_paste_a_link_first": "先添加截图或粘贴链接",
			"clear_all": "全部清除",
			"critique_this_flow_count_screens_other": "评审此流程 · {{count}} 个界面",
			"critique_this_screen": "Critique this screen",
			"drop_screenshots_or_click_to_browse": "拖入截图，或点击浏览",
			"fix_my_access": "修复我的访问权限",
			"fix_the_link": "修正链接",
			"hide_access_steps": "隐藏访问步骤",
			"move_earlier": "前移",
			"move_later": "后移",
			"one_screen_or_several_in_order_for_a_flow_png_jp": "单个界面，或按顺序排列多个组成流程 · PNG、JPG、WebP",
			"remove": "移除",
			"remove_name": "移除 {{name}}",
			"send_screenshots": "发送截图",
			"start_the_critique": "开始评审",
			"step_n": "第 {{n}} 步",
			"try_again": "重试",
			"unrecognised": "Unrecognised",
			"use_a_local_folder_instead": "改用本地文件夹",
			"start_kind_figma": "评审 Figma 文件",
			"start_kind_repo": "评审代码仓库",
			"start_kind_local": "评审本地代码",
			"start_kind_url": "评审运行中的应用",
			"start_this": "评审这个",
			"start_plain": "评审",
			"staged_one_hint": "1 个界面 · 再添加一个即可作为流程评审。",
			"staged_flow_hint_other": "{{n}} 个界面 · 此顺序即流程顺序——开始前请调整顺序或移除。",
			"title_blocked": "我没能进入",
			"title_ask": "要评审什么？",
			"link_placeholder_staged": "正在使用你的截图——清除截图即可改为评审链接",
			"link_placeholder": "Figma 链接 · git 仓库 · 本机文件夹 · 运行中的 URL（localhost 或已部署预览）",
			"link_label": "要评审的链接",
			"render_before_judging": "我会先渲染再评判，绝不只看代码。如果应用已在运行，粘贴它的 URL，我就能测量真实颜色和尺寸，而不是估算。"
		},
		constants: {
			"blocked_figma_app_missing_hint": "在 Figma 桌面版中打开该文件后重试，或把画板导出为 PNG 拖到这里。",
			"blocked_figma_app_missing_say": "我连不上 Figma — 桌面应用没在运行，或者我这边没有可用的 Figma 工具。",
			"blocked_figma_export_needed_hint": "把每个画板导出成 PNG，当截图丢进来就行 — 反正我看的是像素。",
			"blocked_figma_export_needed_say": "我这边没法直接从 Figma 链接里取画板 — 我没有可用的 Figma 桌面工具。",
			"blocked_figma_file_closed_hint": "在 Figma 桌面版中打开它，然后重试。",
			"blocked_figma_file_closed_say": "Figma 正在运行，但那个文件没有打开。",
			"blocked_figma_no_permission_auth_lead": "Figma 的访问权限按账号划分，而我只能读取桌面应用当前打开的内容 — 我自己没有登录账号。解决办法如下。",
			"blocked_figma_no_permission_auth_step_1": "1. 让文件所有者把它分享给你的 Figma 账号",
			"blocked_figma_no_permission_auth_step_2": "2. 在 Figma 桌面版中打开它",
			"blocked_figma_no_permission_auth_step_3": "3. 回到这里，按“重试”",
			"blocked_figma_no_permission_auth_tail": "如果一直拿不到权限，把画板导出为 PNG 同样有效 — 两种方式我评审的都是像素。",
			"blocked_figma_no_permission_hint": "申请权限，或把画板导出为 PNG 拖到这里。",
			"blocked_figma_no_permission_say": "你的 Figma 账号无法查看那个文件。",
			"blocked_no_access_hint": "如果你已经把它检出到本地，直接给我文件夹路径也行。",
			"blocked_no_access_say": "我打不开那个仓库。它要么是私有的（而我没有凭证），要么不存在 — GitHub 对这两种情况返回相同错误。",
			"blocked_not_found_hint": "检查所有者和名称，或给我一个本地文件夹路径。",
			"blocked_not_found_say": "那个 URL 上没有这个仓库。",
			"blocked_other_hint": "用截图是最快的绕行办法。",
			"blocked_other_say": "我进不去。",
			"kind_figma": "Figma 文件",
			"kind_local": "本地代码",
			"kind_repo": "仓库",
			"kind_url": "运行中的应用",
			"scan_finding_screens": "正在查找界面",
			"scan_grouping_flows": "正在按可能的流程分组",
			"scan_which_renderable": "正在判断哪些可以渲染",
			"sev_catastrophe": "灾难级",
			"sev_cosmetic": "外观",
			"sev_major": "重大",
			"sev_minor": "轻微",
			"stage_checking_hierarchy": "正在检查层级、对比度和内容",
			"stage_double_checking": "正在复核每条结论",
			"stage_getting_pixels": "正在获取真实像素",
			"stage_reading_screens": "正在阅读界面",
			"stage_weighing_task": "正在结合任务权衡",
			"stage_writing_up": "正在撰写评审",
			"wait_figma": "正在打开 Figma 文件并列出其中的画板…",
			"wait_local": "正在扫描代码中的路由…",
			"wait_repo": "正在克隆仓库并列出其中的路由…",
			"wait_url": "正在加载页面并跟踪其中的链接…"
		},
		designCritiquePage: {
			"a_critique_is_still_running_click_to_watch_it": "有评审仍在进行 — 点击查看",
			"across_the_flow": "整个流程",
			"click_to_enlarge": "点击放大",
			"close_esc": "关闭（Esc）",
			"couldn_t_see": "无法查看",
			"couldn_t_tell_what_that_is_give_me_a_figma_link": "无法识别这是什么。请提供 Figma 链接、GitHub/GitLab/Bitbucket 仓库、本地绝对路径，或已在运行的 URL。",
			"critique_ready": "评审完成",
			"critique_untitled": "评审",
			"design_critique": "Design Critique",
			"enlarge": "放大",
			"full_size": "原始尺寸",
			"full_size_view": "查看原图",
			"history_count": "历史记录（{{n}}）",
			"i_got_in_but_there_s_nothing_in_there_i_can": "我进去了，但里面没有我能渲染的东西。还是直接丢截图给我吧。",
			"new": "新建",
			"no_screens_to_show_the_critic_couldn_t_get_pixel": "没有可显示的界面 — 评审无法获取此项的像素。请查看面板中的“无法查看”。",
			"nothing_major": "无重大问题",
			"numbered_pins_mark_issues_on_this_screen": "编号图钉标出此界面上的问题",
			"on_screen": "● 单个界面",
			"only_added_the_first_room_the_limit_is_max_screens": "只添加了前 {{room}} 张 — 上限为 {{max}} 张屏幕。",
			"pick_a_step_above": "在上方选择一个步骤",
			"point_me_at_a_running_url": "指向一个运行中的网址",
			"point_me_at_a_screen_or_a_whole_flow_and_i_ll_re": "给我一个界面 — 或整个流程 — 我会像设计师朋友一样解读：哪些做得好、哪些可以打磨、以及为什么。",
			"running": "运行中",
			"screen_heading": "界面",
			"screens_in_order": "按顺序排列的界面",
			"see_an_example": "查看示例",
			"send_screenshots": "发送截图",
			"show_this_screen": "显示此界面",
			"something_went_wrong": "something went wrong",
			"start_a_new_critique_anything_already_running_ke": "开始新的评审 — 进行中的不受影响",
			"step_n": "第 {{n}} 步",
			"still_working_on_this_one_it_s_kept_running_come": "Still working on this one. It’s kept running — come back in a minute.",
			"still_working_on_this_one_it_s_kept_running_come_2": "Still working on this one. It’s kept running — come back to this page in a minute and it’ll pick up where it left off.",
			"switch_critique": "切换评审",
			"that_critique_didn_t_finish": "That critique didn’t finish.",
			"that_s_more_than_20_screens_send_fewer": "That’s more than 20 screens — send fewer.",
			"that_s_the_limit_of_max_screens": "已达到 {{max}} 张屏幕的上限。",
			"that_scan_didn_t_finish": "That scan didn’t finish.",
			"those_weren_t_image_files": "Those weren’t image files.",
			"what_i_d_tighten": "可以打磨的地方",
			"what_s_working": "做得好的地方",
			"what_you_ll_get": "你将获得",
			"your_critiques": "你的评审",
			"your_question_click_to_see_the_answer": "你的提问 — 点击查看回答",
			"rail_uploading": "正在上传…",
			"rail_reading": "正在读取你的设计…",
			"rail_flow_other": "由 {{n}} 个界面组成的流程——我也会检查它们之间的跳转。",
			"rail_one_screen": "一个界面。",
			"rail_pending_figma": "一个 Figma 文件——评判前先渲染。",
			"rail_pending_repo": "一个代码仓库——评判前先渲染。",
			"rail_pending_local": "本地代码——评判前先渲染。",
			"rail_pending_url": "一个运行中的应用——评判前先渲染。",
			"rail_pending_design": "一个设计——评判前先渲染。",
			"rail_getting_ready": "正在准备界面。",
			"critique_ready_fallback": "评审已完成",
			"ask_too_long": "耗时太久——请再问一次。",
			"ask_went_wrong": "出了点问题。",
			"entry_meta_screens_other": "{{n}} 个界面 · {{when}}",
			"findings_count_other": "{{n}} 条问题",
			"nothing_flagged": "未发现问题",
			"design_critique_fallback": "设计评审",
			"flow_screens_count_other": "{{n}} 个界面",
			"screen_n": "界面 {{n}}",
			"get_overall_read": "对整体表现的总体评价",
			"get_whats_working": "做得好的地方，好让它在下一轮修改中保留下来",
			"get_top_things": "最该收紧的几处，并在界面上标出",
			"no_critiques_narrow": "还没有评审。请在下方放入截图。",
			"no_critiques_wide": "还没有评审。请把截图放到面板中 →",
			"the_design_alt": "设计图"
		},
		findingRow: {
			"based_on": "依据",
			"finding": "发现",
			"fix": "修复方法",
			"suggestion": "建议",
			"what_i_saw": "我看到的",
			"where": "位置",
			"steps_range": "第 {{range}} 步",
			"flow_badge": "流程"
		},
		manifest: {
			"use_case_1": "根据可见区域，以严重程度和设计准则为依据，评审单个界面或完整产品流程。",
			"configuration_1": "拖入截图即可零配置评审，也可以提供 Figma 文件、仓库、本地文件夹或已运行的 URL；私有 GitHub 源可能需要运行 `gh auth login`。",
			"description": "在找同事之前先自己做一轮设计评审。给它一张截图、一整套多屏流程、一个 Figma 文件、一个 git 仓库，或者一个已经在跑的 URL，它会找出候选界面，让你选择要看哪些，然后像资深设计师那样反馈：整体印象、哪些地方做得好、哪些值得收紧，每条都对应一条具名的设计准则。多屏流程还会得到单屏看不出的跨屏发现 — 控件不一致、缺少进度、无法返回、走进死路。它会先把代码和 Figma 渲染出来再判断，绝不评论自己没真正看到的画面；对于到不了的界面，它会直说，而不是猜。",
			"display_name": "Design Critique",
			"highlight_1": "接受截图、Figma 链接、git 仓库、本地文件夹或运行中的 URL — 开始之前先告诉你它找到了什么",
			"highlight_2": "在渲染后的页面上实测对比度和点击目标尺寸，而不是从图片上估算",
			"highlight_3": "多屏流程会做跨屏检查：控件一致性、进度提示、返回路径、重复索取、死路",
			"highlight_4": "每条发现都点明背后的设计准则（Nielsen 1-10、WCAG、Gestalt、Fitts），并按 NN/g 1-4 级标注严重程度",
			"highlight_5": "选中报告里的任意一行，就地追问",
			"highlight_6": "会告诉你哪些没看到，而不是去评论空白或被遮挡的界面",
			"highlight_7": "对评审对象零接触：不安装项目依赖、不运行项目脚本、不启动开发服务器、也不修改任何文件",
			"highlight_8": "截图用无头浏览器完成：首次使用时下载一次，缓存在主目录里，绝不放进项目",
			"page_label": "Design Critique"
		},
		scopingPicker: {
			"critique_this_flow_count_screens_other": "评审此流程 · {{count}} 个界面",
			"critique_this_screen": "Critique this screen",
			"drag_to_reorder": "拖动重新排序",
			"move_earlier": "前移",
			"move_later": "后移",
			"optional_brief_who_is_it_for_and_what_is_the_mai": "可选说明：面向谁，主要任务是什么？",
			"optional_who_is_it_for_and_what_s_the_main_task": "可选：面向谁，主要任务是什么？",
			"pick_at_least_one_screen": "Pick at least one screen",
			"screens": "界面",
			"start_over": "重新开始",
			"suggested_flows": "推荐流程",
			"what_should_i_audit": "我该评审什么？",
			"screens_found_count_other": "找到 {{n}} 个界面 · 可渲染 {{m}} 个",
			"flow_n": "流程 {{n}}",
			"picked_count_other": "已选 {{n}} 个",
			"hint_order": "数字是我查看它们的顺序——拖动某行可调整顺序，也可以用键盘上的 ‹ ›。",
			"hint_pick": "点击界面即可选中。选中多个即可作为一个流程进行评审。",
			"cant_render_title": "这个界面无法渲染",
			"cant_render_short": "无法渲染",
			"group_fallback": "界面",
			"tag_from_links": "来自链接",
			"tag_guess": "推测"
		},
		utils: {
			"i_ll_capture_it_and_measure_real_contrast_and_si": "我会截取它，并测量真实对比度和尺寸。",
			"i_ll_clone_it_and_list_the_screens_only_pages_th": "我会克隆它并列出界面。只有无需服务器即可渲染的页面才能看到。",
			"i_ll_list_the_screens_only_pages_that_render_wit": "我会列出界面。只有无需服务器即可渲染的页面才能看到。",
			"i_ll_pull_the_frames": "I’ll pull the frames.",
			"it_must_be_running_right_now_i_ll_capture_it_liv": "它必须正在运行。我会实时截取，并测量真实对比度和尺寸。",
			"not_something_i_recognise_give_me_a_figma_link_a": "我无法识别。请提供 Figma 链接、GitHub 仓库、本地绝对路径，或已在提供服务的 URL。",
			"screen_fallback": "界面"
		},
		waitingScreen: {
			"cancel_this_run": "取消本次运行",
			"stop_this_run_and_discard_it": "停止并丢弃本次运行",
			"getting_screens_ready": "正在准备界面…",
			"title_scanning": "正在查找要审查的界面",
			"title_uploading_screens_other": "正在上传 {{n}} 个界面…",
			"title_uploading_one": "正在上传你的截图…",
			"title_reading_flow_other": "正在读取你的流程 · {{n}} 个界面",
			"title_reading_screen": "正在读取你的界面",
			"title_getting_pixels": "先获取真实像素",
			"foot_still_going": "仍在进行——界面较多的流程可能需要几分钟。你可以离开此页面；评审会继续进行，回来时就能看到。",
			"foot_navigate_away": "你可以离开此页面——评审会继续进行。"
		},
		common: {
			"send_failed": "发送失败",
			"unexpected_server_response": "服务器响应异常"
		}
	}
};
var own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function lookup(catalog, key) {
	let node = catalog;
	for (const part of key.split(".")) {
		if (node === void 0 || typeof node === "string" || !own(node, part)) return void 0;
		node = node[part];
	}
	return typeof node === "string" ? node : void 0;
}
/** The catalogs to try for `locale`, most specific first, always ending in English. */
function localeChain(locale) {
	const chain = [];
	const add = (candidate) => {
		if (own(CATALOGS, candidate) && !chain.includes(candidate)) chain.push(candidate);
	};
	add(locale);
	add(locale.split("-")[0]);
	add("en");
	return chain;
}
function currentLocale() {
	try {
		const locale = activeLocale();
		return typeof locale === "string" && locale ? locale : "en";
	} catch {
		return "en";
	}
}
var PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;
var pluralRules = /* @__PURE__ */ new Map();
function pluralCategory(locale, count) {
	let rules = pluralRules.get(locale);
	if (!rules) {
		rules = new Intl.PluralRules(locale);
		pluralRules.set(locale, rules);
	}
	return rules.select(count);
}
/** The keys to try in `locale`'s catalog, most specific first. */
function candidates(locale, key, vars) {
	const count = vars && own(vars, "count") ? vars.count : void 0;
	if (typeof count !== "number" || !Number.isFinite(count)) return [key];
	const forms = [`${key}_${pluralCategory(locale, count)}`, key];
	return count === 0 ? [`${key}_zero`, ...forms] : forms;
}
function t(key, vars) {
	for (const locale of localeChain(currentLocale())) {
		let text;
		for (const candidate of candidates(locale, key, vars)) {
			text = lookup(CATALOGS[locale], candidate);
			if (text !== void 0) break;
		}
		if (text !== void 0) return text.replace(PLACEHOLDER, (whole, name) => vars && own(vars, name) ? String(vars[name]) : whole);
	}
	return key;
}
var numberFormats = /* @__PURE__ */ new Map();
/** A number in the host's active language (`1,234`, `১২৩`), as the dashboard's
*  `fmtNumber` spells it; a non-finite value reads `—`. */
function fmtNumber(value) {
	if (!Number.isFinite(value)) return "—";
	const locale = currentLocale();
	let format = numberFormats.get(locale);
	if (!format) {
		try {
			format = new Intl.NumberFormat(locale, { localeMatcher: "lookup" });
		} catch {
			format = new Intl.NumberFormat("en");
		}
		numberFormats.set(locale, format);
	}
	return format.format(value);
}
// src/constants.ts
/**
* ## Why the UI copy below sits behind GETTERS
*
* Every table in this module is evaluated ONCE, at import. A bare
* `i18nT('…')` in a property position would therefore resolve against whatever
* language happened to be active at boot and never re-resolve when the user
* switches language — the frozen-at-import bug `lib/effort.ts` documents.
*
* `effort.ts` solves it by storing catalog KEYS and resolving in an exported
* function. That shape is unavailable here: every consumer of these tables reads
* the value POSITIONALLY (`list[i].label`, `KIND_WAIT[kind]`,
* `sevOf(sev).label`), so moving the lookup into a new resolver would mean
* rewriting four other modules. A getter puts the `i18nT()` call on the property
* ACCESS instead, which is what already happens per render — same guarantee, no
* change to any call site.
*
* `i18nT('<literal>')` inside the getter keeps `scripts/check-i18n-keys.mjs`
* able to resolve the key statically, which is the property that makes a key
* verifiable at all.
*
* One caveat, deliberate: `DesignCritiquePage` SPREADS a `BLOCKED` entry into
* React state (`{ ...(BLOCKED[reason] || BLOCKED.other), detail }`). A spread
* invokes getters, so that copy is resolved once and then held — an open blocked
* screen keeps its boot-language text across a language switch until the run is
* retried. See `blockedFor()` below for the one-line fix that closes it.
*/
var AGENT = "kirocrew";
var HKEY = "dc-history-v1";
var JOBKEY = "dc-current-job";
var SLOTSKEY = "dc-open-slots-v1";
var LIVEKEY = "dc-live-runs-v1";
var RAIL_W = "440px";
var HARD_CAP_MS = 9e5;
/**
* Severity display metadata, keyed by the LOWERCASE discriminant the critic
* emits (`'major'`), which is a protocol value and stays as it is. Only `label`
* — the NN/g severity name shown on the pill and the tally chip — is copy.
*/
var SEV = {
	catastrophe: {
		get label() {
			return t("constants.sev_catastrophe");
		},
		rank: 0,
		color: "#e5484d",
		icon: AlertTriangle
	},
	major: {
		get label() {
			return t("constants.sev_major");
		},
		rank: 1,
		color: "#f5a623",
		icon: AlertCircle
	},
	minor: {
		get label() {
			return t("constants.sev_minor");
		},
		rank: 2,
		color: "#e2c541",
		icon: Wrench
	},
	cosmetic: {
		get label() {
			return t("constants.sev_cosmetic");
		},
		rank: 3,
		color: "var(--muted, #8a8f98)",
		icon: Sparkle
	}
};
var sevOf = (s) => SEV[s] || SEV.cosmetic;
/**
* The same four kinds as catalog keys, for the places the kind is SHOWN rather
* than sent to the model. Split from `KIND_LABEL` rather than replacing it
* because the two have genuinely different requirements: one must stay English,
* the other must follow the UI language.
*/
var KIND_LABEL_KEY = {
	figma: "constants.kind_figma",
	repo: "constants.kind_repo",
	local: "constants.kind_local",
	url: "constants.kind_url"
};
/**
* Localised name for a target kind. Returns '' for an unknown kind so callers
* keep their existing `|| fallback` behaviour.
*
* `hasOwnProperty`, not `in`: `kind` arrives from `detectKind()` and from a
* persisted job record, so a stored `'toString'` would otherwise resolve to an
* Object.prototype member and hand a function to i18next.
*
* PARTLY wired. The bare render in `Composer.tsx` now calls this
* function: a lone bold token carries no English scaffolding, so the noun
* could be swapped on its own without inventing a sentence key. The other two
* call sites are string concatenations that this function alone cannot fix:
*
*   - `Composer.tsx:41`    `'Critique ' + (KIND_LABEL[kind] || 'this')`
*   - `DesignCritiquePage.tsx:1005`
*                          `'A ' + (KIND_LABEL[kind] || 'design') + ' — …'`
*
* Those two need a WHOLE-SENTENCE key with the kind interpolated
* (`i18nT('…critique_kind', { kind: kindLabel(kind) })`). Dropping a localised
* noun into those English fragments would produce a half-translated sentence and
* hard-code English word order.
*/
function kindLabel(kind) {
	if (!kind) return "";
	return Object.prototype.hasOwnProperty.call(KIND_LABEL_KEY, kind) ? t(KIND_LABEL_KEY[kind]) : "";
}
var STAGES = [
	{
		at: 0,
		get label() {
			return t("constants.stage_getting_pixels");
		}
	},
	{
		at: 8,
		get label() {
			return t("constants.stage_reading_screens");
		}
	},
	{
		at: 22,
		get label() {
			return t("constants.stage_checking_hierarchy");
		}
	},
	{
		at: 45,
		get label() {
			return t("constants.stage_weighing_task");
		}
	},
	{
		at: 70,
		get label() {
			return t("constants.stage_double_checking");
		}
	}
];
var WRITING_STAGE = { get label() {
	return t("constants.stage_writing_up");
} };
var SCAN_STAGES = [
	{
		at: 0,
		get label() {
			return t("constants.scan_finding_screens");
		}
	},
	{
		at: 6,
		get label() {
			return t("constants.scan_which_renderable");
		}
	},
	{
		at: 14,
		get label() {
			return t("constants.scan_grouping_flows");
		}
	}
];
var BLOCKED = {
	"no-access": {
		get say() {
			return t("constants.blocked_no_access_say");
		},
		fix: "local",
		get hint() {
			return t("constants.blocked_no_access_hint");
		}
	},
	"not-found": {
		get say() {
			return t("constants.blocked_not_found_say");
		},
		fix: "retype",
		get hint() {
			return t("constants.blocked_not_found_hint");
		}
	},
	"figma-app-missing": {
		get say() {
			return t("constants.blocked_figma_app_missing_say");
		},
		fix: "shots",
		get hint() {
			return t("constants.blocked_figma_app_missing_hint");
		}
	},
	"figma-export-needed": {
		get say() {
			return t("constants.blocked_figma_export_needed_say");
		},
		fix: "shots",
		get hint() {
			return t("constants.blocked_figma_export_needed_hint");
		}
	},
	"figma-file-closed": {
		get say() {
			return t("constants.blocked_figma_file_closed_say");
		},
		fix: "retry",
		get hint() {
			return t("constants.blocked_figma_file_closed_hint");
		}
	},
	"figma-no-permission": {
		get say() {
			return t("constants.blocked_figma_no_permission_say");
		},
		fix: "shots",
		get hint() {
			return t("constants.blocked_figma_no_permission_hint");
		},
		auth: {
			get lead() {
				return t("constants.blocked_figma_no_permission_auth_lead");
			},
			get cmds() {
				return [
					t("constants.blocked_figma_no_permission_auth_step_1"),
					t("constants.blocked_figma_no_permission_auth_step_2"),
					t("constants.blocked_figma_no_permission_auth_step_3")
				];
			},
			get tail() {
				return t("constants.blocked_figma_no_permission_auth_tail");
			}
		}
	},
	other: {
		get say() {
			return t("constants.blocked_other_say");
		},
		fix: "shots",
		get hint() {
			return t("constants.blocked_other_hint");
		}
	}
};
var KIND_WAIT = {
	get figma() {
		return t("constants.wait_figma");
	},
	get repo() {
		return t("constants.wait_repo");
	},
	get local() {
		return t("constants.wait_local");
	},
	get url() {
		return t("constants.wait_url");
	}
};
var BUNDLE_URL = import.meta.url;
var SAMPLE = (name) => new URL("../samples/" + name + ".png", BUNDLE_URL).pathname;
var SAMPLE_SCREENS = [
	{
		step: 1,
		label: "Cart",
		url: SAMPLE("1-cart")
	},
	{
		step: 2,
		label: "Shipping",
		url: SAMPLE("2-shipping")
	},
	{
		step: 3,
		label: "Payment",
		url: SAMPLE("3-payment")
	},
	{
		step: 4,
		label: "Confirmation",
		url: SAMPLE("4-confirm")
	}
];
var SAMPLE_REPORT = {
	overallRead: "The checkout gets the job done, but it loses momentum in the middle — the main button changes colour and label at every step, and nothing tells you how far along you are.",
	health: "Promising, needs work",
	tally: {
		catastrophe: 0,
		major: 2,
		minor: 2,
		cosmetic: 1
	},
	screens: SAMPLE_SCREENS.map((s) => ({
		step: s.step,
		label: s.label,
		path: ""
	})),
	findings: [
		{
			severity: "major",
			scope: "flow",
			steps: [
				1,
				2,
				3,
				4
			],
			title: "The primary button changes colour and label on every step",
			category: "Consistency",
			location: "Bottom action row, all four steps",
			evidence: "Continue (dark) → Next step (blue) → Pay $130 (green). Three colours, three labels, and it moves from right-aligned to left-aligned on step 2.",
			fix: "Consider one primary style for the whole flow and one verb pattern — \"Continue to shipping\", \"Continue to payment\", \"Pay $130\" — keeping its position fixed.",
			rules: [
				"Nielsen: consistency & standards",
				"Gestalt: common fate",
				"Fitts’s Law: moving target"
			],
			box: null
		},
		{
			severity: "major",
			scope: "flow",
			steps: [
				1,
				2,
				3,
				4
			],
			title: "No sense of progress — how many steps are left?",
			category: "System status",
			location: "All four steps",
			evidence: "Nothing on any screen says step 2 of 4, so the length of the flow is unknowable until it ends.",
			fix: "Consider a small step indicator in the header, or naming the next step in the button.",
			rules: ["Nielsen: visibility of system status"],
			box: null
		},
		{
			severity: "minor",
			scope: "flow",
			steps: [1, 2],
			title: "No way back until step 3",
			category: "User control",
			location: "Steps 1 and 2",
			evidence: "Payment is the first screen with a Back button; before that the only exit is the browser.",
			fix: "You might add a consistent Back on every step after the first.",
			rules: ["Nielsen: user control & freedom"],
			box: null
		},
		{
			severity: "minor",
			scope: "screen",
			steps: [2],
			title: "Required fields aren’t marked",
			category: "Content",
			location: "Address form labels",
			evidence: "Only Phone is annotated, as \"Optional\" — so the other five read as ambiguous rather than required.",
			fix: "Mark the optional one and leave the rest plain, or mark required fields explicitly. Pick one convention.",
			rules: ["Content Design: clear", "Nielsen: error prevention"],
			box: {
				x: .182,
				y: .211,
				w: .636,
				h: .02
			}
		},
		{
			severity: "cosmetic",
			scope: "screen",
			steps: [4],
			title: "The confirmation is a dead end",
			category: "Usability",
			location: "Below the delivery estimate",
			evidence: "The final screen has no onward action — no order detail, no continue shopping.",
			fix: "You might offer one clear next step so the flow ends on an action rather than a full stop.",
			rules: ["Peak-end rule", "Shneiderman: closure"],
			box: {
				x: .156,
				y: .074,
				w: .689,
				h: .514
			}
		}
	],
	keep: ["Single-column forms with generous field spacing — easy to move through.", "The cart states the total plainly, with no surprise fees later in the flow."],
	couldNotSee: ["Validation and error states (none were reachable in the captured pages)."]
};
// src/menuKeyboard.ts
/**
* Keyboard behaviour for the History menu (`role="menu"`, WAI-ARIA menu
* pattern): focus enters the first item on open, ArrowDown / ArrowUp move
* between the enabled items and wrap at both ends, Home / End jump to the
* boundary items, and Tab / Shift+Tab wrap at the boundary items instead of
* leaving a still-open menu. Escape is not handled here: the page owns
* dismissal (close, then focus back on the button).
*
* A restatement of the dashboard's `hooks/useMenuKeyboard.ts` for a bundle,
* which cannot import it. What the dashboard's hook adds and this one does not:
* standing down while a remote Crew is in front, and its WebKit IME latch for
* the key that commits a candidate after `compositionend`. Here a key the IME is
* still composing (`isComposing`) is left alone, as in `focusTrap.ts`.
*/
/** The enabled rows of a menu container: menu items, `role="button"` rows and
*  native buttons, minus `disabled` / `aria-disabled="true"` ones. */
function menuItemsOf(container) {
	if (!container) return [];
	return Array.from(container.querySelectorAll("[role=\"menuitem\"],[role=\"menuitemradio\"],[role=\"menuitemcheckbox\"],[role=\"button\"],button")).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true");
}
/** A text field, text area or contenteditable: its arrow keys move a caret. */
function isEditable(el) {
	if (!el) return false;
	if (el instanceof HTMLTextAreaElement) return true;
	if (el instanceof HTMLInputElement) return ![
		"button",
		"checkbox",
		"radio",
		"submit",
		"reset",
		"range",
		"color",
		"file",
		"image"
	].includes(el.type);
	return el instanceof HTMLElement && el.isContentEditable;
}
/** Handle one keydown against the menu contract; true when it was consumed. */
function handleMenuKeydown(e, getItems) {
	if (e.isComposing) return false;
	if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
		if (e.altKey || e.ctrlKey || e.metaKey) return false;
		const items = getItems();
		if (!items.length) return false;
		e.preventDefault();
		if (e.key === "Home") {
			items[0].focus();
			return true;
		}
		if (e.key === "End") {
			items[items.length - 1].focus();
			return true;
		}
		const idx = items.indexOf(document.activeElement);
		items[idx === -1 ? e.key === "ArrowDown" ? 0 : items.length - 1 : (idx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
		return true;
	}
	if (e.key !== "Tab") return false;
	const items = getItems();
	if (!items.length) return false;
	const first = items[0];
	const last = items[items.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
		return true;
	}
	if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
		return true;
	}
	return false;
}
/** While `enabled`, drive the open menu in `containerRef` from a document-level
*  keydown listener, and move focus onto its first item when it opens. Keys
*  typed into an editable field outside the menu are left to that field. */
function useMenuKeyboard(opts) {
	const { enabled, containerRef, focusFirstOnOpen = true } = opts;
	useEffect(() => {
		if (!enabled) return;
		const items = () => menuItemsOf(containerRef.current);
		if (focusFirstOnOpen) items()[0]?.focus();
		const onKey = (e) => {
			const active = document.activeElement;
			if (active && !containerRef.current?.contains(active) && isEditable(active)) return;
			handleMenuKeydown(e, items);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [
		enabled,
		focusFirstOnOpen,
		containerRef
	]);
}
// src/styles.ts
var S = {
	shell: {
		display: "flex",
		height: "100%",
		minHeight: 0,
		fontFamily: "system-ui, sans-serif",
		color: "var(--text)"
	},
	rail: {
		width: RAIL_W,
		flexShrink: 0,
		borderRight: "1px solid var(--border)",
		background: "rgba(127,127,127,0.05)",
		overflowY: "auto",
		padding: "18px 18px 24px"
	},
	railNarrow: {
		width: "100%",
		borderRight: "none",
		borderBottom: "1px solid var(--border)",
		maxHeight: "52vh"
	},
	railHead: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		marginBottom: "12px"
	},
	title: {
		fontSize: "17px",
		fontWeight: 700,
		display: "flex",
		alignItems: "center",
		gap: "9px",
		flex: 1,
		minWidth: 0
	},
	railCtrls: {
		display: "flex",
		alignItems: "center",
		gap: "8px",
		flexShrink: 0
	},
	runChip: {
		display: "inline-flex",
		alignItems: "center",
		gap: "5px",
		padding: "4px 9px",
		fontSize: "11.5px",
		fontWeight: 600,
		borderRadius: "999px",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--muted)",
		cursor: "pointer",
		flexShrink: 0
	},
	readyChip: {
		borderColor: "var(--accent)",
		color: "var(--accent)"
	},
	pendingRead: {
		color: "var(--muted)",
		fontStyle: "italic"
	},
	railBtn: {
		display: "inline-flex",
		alignItems: "center",
		gap: "5px",
		padding: "5px 10px",
		fontSize: "12px",
		fontWeight: 600,
		borderRadius: "7px",
		cursor: "pointer",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)"
	},
	menu: {
		position: "absolute",
		top: "32px",
		right: 0,
		width: "300px",
		maxHeight: "360px",
		overflowY: "auto",
		background: "var(--card)",
		border: "1px solid var(--border)",
		borderRadius: "10px",
		padding: "6px",
		zIndex: 50,
		boxShadow: "0 10px 30px rgba(0,0,0,.4)"
	},
	menuItem: {
		display: "flex",
		gap: "9px",
		alignItems: "center",
		padding: "7px",
		borderRadius: "8px",
		cursor: "pointer"
	},
	menuThumb: {
		width: "48px",
		height: "32px",
		objectFit: "cover",
		borderRadius: "5px",
		border: "1px solid var(--border)",
		flexShrink: 0
	},
	menuRead: {
		fontSize: "12.5px",
		fontWeight: 600,
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	menuTime: {
		fontSize: "11px",
		color: "var(--muted)",
		marginTop: "2px"
	},
	sub: {
		fontSize: "12.5px",
		color: "var(--muted)",
		lineHeight: 1.45,
		margin: "0 0 12px"
	},
	linkBtn: {
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		padding: "6px 11px",
		fontSize: "12.5px",
		fontWeight: 600,
		borderRadius: "7px",
		cursor: "pointer",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)"
	},
	sectionH: {
		fontSize: "11px",
		fontWeight: 700,
		textTransform: "uppercase",
		letterSpacing: ".04em",
		color: "var(--muted)",
		margin: "20px 0 8px"
	},
	listItem: {
		display: "flex",
		gap: "10px",
		alignItems: "center",
		padding: "8px",
		border: "1px solid var(--border)",
		borderRadius: "9px",
		marginBottom: "7px",
		cursor: "pointer",
		background: "var(--card)"
	},
	listThumb: {
		width: "52px",
		height: "36px",
		objectFit: "cover",
		borderRadius: "5px",
		border: "1px solid var(--border)",
		flexShrink: 0
	},
	listRead: {
		fontSize: "12.5px",
		fontWeight: 600,
		display: "-webkit-box",
		WebkitLineClamp: 2,
		WebkitBoxOrient: "vertical",
		overflow: "hidden"
	},
	listTime: {
		fontSize: "11px",
		color: "var(--muted)",
		marginTop: "3px"
	},
	emptyList: {
		fontSize: "12.5px",
		color: "var(--muted)",
		border: "1px dashed var(--border)",
		borderRadius: "10px",
		padding: "16px",
		textAlign: "center"
	},
	readLine: {
		fontSize: "15px",
		fontWeight: 600,
		lineHeight: 1.4,
		margin: "0 0 6px"
	},
	health: {
		fontSize: "12.5px",
		color: "var(--muted)",
		marginBottom: "10px"
	},
	chips: {
		display: "flex",
		gap: "7px",
		flexWrap: "wrap"
	},
	chip: {
		display: "inline-flex",
		alignItems: "center",
		gap: "5px",
		padding: "3px 9px",
		borderRadius: "999px",
		fontSize: "11.5px",
		fontWeight: 600,
		border: "1px solid var(--border)"
	},
	finding: {
		overflow: "hidden",
		transition: "background .12s, box-shadow .12s"
	},
	fRow: {
		display: "flex",
		alignItems: "flex-start",
		gap: "9px",
		padding: "10px 4px",
		cursor: "pointer"
	},
	numBadge: {
		width: "19px",
		height: "19px",
		borderRadius: "999px",
		color: "#fff",
		fontSize: "11px",
		fontWeight: 700,
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0
	},
	fTitle: {
		fontSize: "13px",
		fontWeight: 600,
		flex: 1,
		lineHeight: 1.35
	},
	fMeta: {
		fontSize: "10.5px",
		color: "var(--muted)"
	},
	sevPill: {
		display: "inline-flex",
		alignItems: "center",
		gap: "5px",
		padding: "2px 7px",
		borderRadius: "999px",
		fontSize: "10.5px",
		fontWeight: 700,
		border: "1px solid",
		flexShrink: 0
	},
	fBody: {
		padding: "0 4px 12px 30px",
		fontSize: "12.5px",
		lineHeight: 1.5
	},
	fLabel: {
		fontSize: "10.5px",
		fontWeight: 700,
		color: "var(--muted)",
		marginTop: "8px"
	},
	ruleBadge: {
		display: "inline-flex",
		alignItems: "center",
		padding: "2px 7px",
		borderRadius: "999px",
		fontSize: "10.5px",
		color: "var(--muted)",
		border: "1px solid var(--border)"
	},
	keepItem: {
		display: "flex",
		gap: "8px",
		alignItems: "flex-start",
		fontSize: "12.5px",
		lineHeight: 1.45,
		marginBottom: "6px"
	},
	seeItem: {
		fontSize: "12px",
		color: "var(--muted)",
		lineHeight: 1.45,
		marginBottom: "4px"
	},
	composerMid: {
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: "24px"
	},
	card: {
		width: "100%",
		maxWidth: "660px",
		display: "flex",
		flexDirection: "column",
		gap: "14px"
	},
	cardTitle: {
		fontSize: "19px",
		fontWeight: 700,
		textAlign: "center",
		margin: 0
	},
	blockedBox: {
		border: "1px solid var(--error, #e5484d)",
		background: "color-mix(in srgb, var(--error, #e5484d) 8%, transparent)",
		borderRadius: "11px",
		padding: "13px"
	},
	blockedSay: {
		fontSize: "13px",
		fontWeight: 600,
		lineHeight: 1.45
	},
	blockedHint: {
		fontSize: "12.5px",
		color: "var(--muted)",
		lineHeight: 1.45,
		marginTop: "5px"
	},
	authBox: {
		marginTop: "11px",
		paddingTop: "11px",
		borderTop: "1px solid var(--border)"
	},
	authCmds: {
		margin: "8px 0",
		padding: "9px 11px",
		background: "var(--bg)",
		border: "1px solid var(--border)",
		borderRadius: "8px",
		fontSize: "11.5px",
		fontFamily: "ui-monospace, monospace",
		lineHeight: 1.6,
		whiteSpace: "pre-wrap",
		color: "var(--text)",
		userSelect: "text"
	},
	blockedDetail: {
		fontSize: "11px",
		color: "var(--muted)",
		fontFamily: "ui-monospace, monospace",
		marginTop: "7px",
		wordBreak: "break-all",
		opacity: .8
	},
	cardSub: {
		fontSize: "13px",
		color: "var(--muted)",
		textAlign: "center",
		margin: "0 0 4px",
		lineHeight: 1.5,
		minHeight: "20px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "8px",
		flexWrap: "wrap"
	},
	clearLink: {
		border: "none",
		background: "none",
		padding: 0,
		color: "var(--accent)",
		fontSize: "12.5px",
		fontWeight: 600,
		cursor: "pointer",
		textDecoration: "underline"
	},
	dropTile: {
		height: "232px",
		boxSizing: "border-box",
		border: "2px dashed var(--border)",
		borderRadius: "14px",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "9px",
		cursor: "pointer",
		color: "var(--muted)",
		background: "rgba(127,127,127,0.03)"
	},
	stagedRegion: {
		height: "232px",
		boxSizing: "border-box",
		border: "2px solid var(--border)",
		borderRadius: "14px",
		padding: "14px",
		display: "flex",
		flexWrap: "wrap",
		gap: "12px",
		alignContent: "flex-start",
		overflowY: "auto",
		background: "rgba(127,127,127,0.03)"
	},
	orRow: {
		display: "flex",
		alignItems: "center",
		gap: "12px",
		color: "var(--muted)",
		fontSize: "11.5px",
		fontWeight: 600
	},
	orLine: {
		flex: 1,
		height: "1px",
		background: "var(--border)"
	},
	linkInput: {
		width: "100%",
		boxSizing: "border-box",
		height: "44px",
		padding: "0 13px",
		fontSize: "13px",
		borderRadius: "10px",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)",
		fontFamily: "inherit"
	},
	bigStart: {
		width: "100%",
		height: "46px",
		fontSize: "14px",
		fontWeight: 700,
		borderRadius: "10px",
		border: "1px solid var(--accent)",
		background: "var(--accent)",
		color: "var(--accent-fg)",
		cursor: "pointer",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "8px",
		marginTop: "2px"
	},
	cardHint: {
		fontSize: "11.5px",
		color: "var(--muted)",
		textAlign: "center",
		lineHeight: 1.5,
		margin: 0
	},
	stagedItem: {
		width: "168px",
		position: "relative"
	},
	stagedThumb: {
		width: "168px",
		height: "112px",
		borderRadius: "9px",
		border: "1px solid var(--border)",
		overflow: "hidden",
		background: "var(--card)"
	},
	stagedImg: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		objectPosition: "top",
		display: "block"
	},
	stepChip: {
		position: "absolute",
		top: "6px",
		left: "6px",
		minWidth: "20px",
		height: "20px",
		padding: "0 6px",
		borderRadius: "999px",
		background: "rgba(0,0,0,.72)",
		color: "#fff",
		fontSize: "11px",
		fontWeight: 700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	iconBtn: {
		width: "22px",
		height: "22px",
		borderRadius: "999px",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0
	},
	killBtn: {
		position: "absolute",
		top: "6px",
		right: "6px",
		width: "22px",
		height: "22px",
		borderRadius: "999px",
		border: "none",
		background: "rgba(0,0,0,.72)",
		color: "#fff",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0
	},
	stagedFoot: {
		display: "flex",
		alignItems: "center",
		gap: "6px",
		marginTop: "6px"
	},
	stagedName: {
		flex: 1,
		minWidth: 0,
		fontSize: "10.5px",
		color: "var(--muted)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap"
	},
	addTile: {
		width: "168px",
		height: "112px",
		borderRadius: "9px",
		border: "1px dashed var(--border)",
		background: "transparent",
		color: "var(--muted)",
		cursor: "pointer",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "5px",
		fontSize: "11.5px"
	},
	startOff: {
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--muted)",
		cursor: "not-allowed"
	},
	scopeNote: {
		fontSize: "12.5px",
		color: "var(--muted)",
		lineHeight: 1.5,
		margin: 0
	},
	flowCard: {
		display: "flex",
		gap: "10px",
		alignItems: "flex-start",
		padding: "11px 12px",
		border: "1px solid var(--border)",
		borderRadius: "10px",
		background: "var(--card)",
		cursor: "pointer",
		textAlign: "left",
		width: "100%",
		color: "var(--text)"
	},
	flowCardOn: {
		borderColor: "var(--accent)",
		boxShadow: "0 0 0 1px var(--accent)"
	},
	flowName: {
		fontSize: "13px",
		fontWeight: 700
	},
	flowWhy: {
		fontSize: "11.5px",
		color: "var(--muted)",
		marginTop: "3px",
		lineHeight: 1.45
	},
	flowSteps: {
		fontSize: "11.5px",
		color: "var(--muted)",
		marginTop: "5px"
	},
	guessTag: {
		fontSize: "10px",
		fontWeight: 700,
		textTransform: "uppercase",
		letterSpacing: ".05em",
		color: "var(--muted)",
		border: "1px solid var(--border)",
		borderRadius: "999px",
		padding: "1px 6px",
		flexShrink: 0
	},
	scopeWrap: {
		flex: 1,
		minHeight: 0,
		overflowY: "auto",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "20px 24px 0"
	},
	scopeCard: {
		width: "100%",
		maxWidth: "660px",
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		gap: "10px"
	},
	scopeScrollFlex: {
		border: "1px solid var(--border)",
		borderRadius: "10px",
		padding: "6px"
	},
	scopeFoot: {
		position: "sticky",
		bottom: 0,
		zIndex: 5,
		flexShrink: 0,
		display: "flex",
		flexDirection: "column",
		gap: "9px",
		paddingTop: "12px",
		paddingBottom: "14px",
		marginTop: "auto",
		borderTop: "1px solid var(--border)",
		background: "var(--bg)",
		boxShadow: "0 -10px 18px -12px rgba(0,0,0,.55)"
	},
	groupH: {
		fontSize: "10px",
		fontWeight: 700,
		textTransform: "uppercase",
		letterSpacing: ".05em",
		color: "var(--muted)",
		padding: "8px 8px 4px"
	},
	pickRow: {
		display: "flex",
		alignItems: "center",
		gap: "9px",
		padding: "6px 8px",
		borderRadius: "7px",
		cursor: "pointer",
		fontSize: "12.5px"
	},
	pickRowOff: {
		opacity: .45,
		cursor: "not-allowed"
	},
	grip: {
		display: "flex",
		alignItems: "center",
		color: "var(--muted)",
		cursor: "grab",
		flexShrink: 0,
		marginLeft: "-2px"
	},
	pickRowDrag: { opacity: .4 },
	pickOrd: {
		width: "18px",
		height: "18px",
		borderRadius: "999px",
		fontSize: "10px",
		fontWeight: 700,
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		background: "var(--accent)",
		color: "var(--accent-fg)"
	},
	pickBox: {
		width: "18px",
		height: "18px",
		borderRadius: "5px",
		border: "1px solid var(--border)",
		flexShrink: 0
	},
	pickWhy: {
		fontSize: "10.5px",
		color: "var(--muted)"
	},
	strip: {
		display: "flex",
		gap: "14px",
		padding: "14px 18px",
		borderBottom: "1px solid var(--border)",
		overflowX: "auto",
		flexShrink: 0,
		alignItems: "flex-start"
	},
	thumb: {
		width: "128px",
		flexShrink: 0,
		cursor: "pointer",
		border: "none",
		background: "none",
		padding: 0,
		textAlign: "left",
		color: "var(--text)"
	},
	thumbBox: {
		position: "relative",
		width: "128px",
		height: "84px",
		borderRadius: "8px",
		border: "1px solid var(--border)",
		overflow: "hidden",
		background: "var(--card)"
	},
	thumbBoxOn: {
		borderColor: "var(--accent)",
		boxShadow: "0 0 0 2px color-mix(in srgb, var(--accent) 40%, transparent)"
	},
	thumbImg: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		objectPosition: "top",
		display: "block"
	},
	thumbCount: {
		position: "absolute",
		bottom: "5px",
		right: "5px",
		display: "inline-flex",
		alignItems: "center",
		gap: "4px",
		padding: "1px 6px",
		borderRadius: "999px",
		background: "rgba(0,0,0,.72)",
		fontSize: "10.5px",
		fontWeight: 700,
		lineHeight: "15px"
	},
	thumbCap: {
		fontSize: "11px",
		marginTop: "7px",
		color: "var(--muted)",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		fontWeight: 600
	},
	stepH: {
		fontSize: "11px",
		fontWeight: 700,
		letterSpacing: ".03em",
		color: "var(--muted)",
		margin: "18px 0 2px",
		display: "flex",
		alignItems: "center",
		gap: "8px"
	},
	stepName: {
		color: "var(--text)",
		fontSize: "12px"
	},
	stepCount: {
		marginLeft: "auto",
		fontSize: "10.5px",
		fontWeight: 600
	},
	flowBadge: {
		minWidth: "20px",
		height: "20px",
		padding: "0 6px",
		borderRadius: "999px",
		color: "#fff",
		fontSize: "10px",
		fontWeight: 700,
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		marginTop: "1px"
	},
	askChip: {
		position: "fixed",
		zIndex: 9998,
		transform: "translate(-50%, -130%)",
		display: "inline-flex",
		alignItems: "center",
		gap: "6px",
		padding: "6px 11px",
		fontSize: "12px",
		fontWeight: 600,
		borderRadius: "999px",
		border: "1px solid var(--accent)",
		background: "var(--card)",
		color: "var(--accent)",
		cursor: "pointer",
		boxShadow: "0 6px 20px rgba(0,0,0,.5)"
	},
	mark: {
		background: "color-mix(in srgb, var(--accent) 22%, transparent)",
		borderBottom: "1px dashed var(--accent)",
		borderRadius: "2px",
		cursor: "pointer",
		padding: "0 1px"
	},
	askPop: {
		position: "fixed",
		zIndex: 9999,
		width: "360px",
		maxWidth: "calc(100vw - 32px)",
		background: "var(--card)",
		border: "1px solid var(--border)",
		borderRadius: "12px",
		boxShadow: "0 14px 40px rgba(0,0,0,.55)",
		padding: "13px",
		display: "flex",
		flexDirection: "column",
		gap: "9px"
	},
	askHead: {
		display: "flex",
		alignItems: "flex-start",
		gap: "8px"
	},
	askIcon: {
		width: "26px",
		height: "26px",
		flexShrink: 0,
		borderRadius: "7px",
		border: "1px solid var(--border)",
		background: "var(--bg)",
		color: "var(--muted)",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0
	},
	askSend: {
		borderColor: "var(--accent)",
		color: "var(--accent)",
		width: "36px",
		height: "36px"
	},
	askThread: {
		maxHeight: "260px",
		overflowY: "auto",
		paddingRight: "2px"
	},
	askQuote: {
		flex: 1,
		minWidth: 0,
		fontSize: "11.5px",
		color: "var(--muted)",
		borderLeft: "2px solid var(--accent)",
		paddingLeft: "8px",
		lineHeight: 1.45,
		maxHeight: "36px",
		overflow: "hidden"
	},
	askInput: {
		width: "100%",
		boxSizing: "border-box",
		height: "36px",
		padding: "0 10px",
		fontSize: "12.5px",
		borderRadius: "8px",
		border: "1px solid var(--border)",
		background: "var(--bg)",
		color: "var(--text)",
		fontFamily: "inherit"
	},
	askAnswer: {
		fontSize: "12.5px",
		lineHeight: 1.55,
		whiteSpace: "pre-wrap"
	},
	askRow: {
		display: "flex",
		gap: "7px",
		alignItems: "center"
	},
	askQ: {
		fontSize: "12px",
		fontWeight: 700
	},
	canvas: {
		flex: 1,
		minWidth: 0,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		position: "relative"
	},
	previewWrap: {
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		padding: "28px",
		gap: "12px"
	},
	preview: {
		position: "relative",
		maxWidth: "100%",
		maxHeight: "100%",
		borderRadius: "12px",
		overflow: "hidden",
		border: "1px solid var(--border)",
		boxShadow: "0 8px 40px rgba(0,0,0,.4)",
		cursor: "zoom-in"
	},
	previewImg: {
		display: "block",
		maxWidth: "100%",
		maxHeight: "calc(100vh - 140px)"
	},
	pinMarker: {
		position: "absolute",
		width: "22px",
		height: "22px",
		borderRadius: "999px",
		color: "#fff",
		fontSize: "11.5px",
		fontWeight: 700,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		transition: "transform .12s, box-shadow .12s, opacity .12s"
	},
	pvbar: {
		fontSize: "11.5px",
		color: "var(--muted)",
		display: "inline-flex",
		alignItems: "center",
		gap: "6px"
	},
	dropTitle: {
		fontSize: "17px",
		fontWeight: 600,
		color: "var(--text)"
	},
	dropSub: {
		fontSize: "12.5px",
		color: "var(--muted)"
	},
	waitWrap: {
		flex: 1,
		minHeight: 0,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		gap: "18px",
		padding: "28px"
	},
	waitCard: {
		width: "100%",
		maxWidth: "660px",
		display: "flex",
		flexDirection: "column",
		gap: "16px"
	},
	waitHead: {
		display: "flex",
		alignItems: "baseline",
		gap: "10px"
	},
	waitTitle: {
		fontSize: "16px",
		fontWeight: 700,
		flex: 1
	},
	waitRow: {
		display: "flex",
		gap: "10px",
		flexWrap: "wrap"
	},
	waitShot: {
		position: "relative",
		borderRadius: "10px",
		overflow: "hidden",
		border: "1px solid var(--border)",
		background: "var(--card)",
		flexShrink: 0
	},
	waitShotImg: {
		display: "block",
		width: "100%",
		height: "100%",
		objectFit: "cover",
		objectPosition: "top"
	},
	sweep: {
		position: "absolute",
		left: 0,
		right: 0,
		height: "38%",
		top: 0,
		background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent) 38%, transparent), transparent)"
	},
	sweepStill: {
		position: "absolute",
		inset: 0,
		background: "color-mix(in srgb, var(--accent) 10%, transparent)"
	},
	waitPlaceholder: {
		height: "132px",
		borderRadius: "12px",
		border: "1px dashed var(--border)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "10px",
		color: "var(--muted)",
		fontSize: "13px",
		padding: "0 18px",
		textAlign: "center"
	},
	stageList: {
		display: "flex",
		flexDirection: "column",
		gap: "9px",
		margin: 0,
		padding: 0,
		listStyle: "none"
	},
	stageItem: {
		display: "flex",
		alignItems: "center",
		gap: "10px",
		fontSize: "13px"
	},
	stageMark: {
		width: "16px",
		height: "16px",
		flexShrink: 0,
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	stageNow: {
		width: "8px",
		height: "8px",
		borderRadius: "999px",
		background: "var(--accent)"
	},
	stagePend: {
		width: "6px",
		height: "6px",
		borderRadius: "999px",
		border: "1px solid var(--border)"
	},
	waitFoot: {
		fontSize: "11.5px",
		color: "var(--muted)",
		lineHeight: 1.5
	},
	muted: {
		fontSize: "13px",
		color: "var(--muted)"
	},
	lbOverlay: {
		position: "fixed",
		inset: 0,
		background: "rgba(0,0,0,.86)",
		zIndex: 9999,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "24px",
		cursor: "zoom-out"
	},
	lbInner: {
		position: "relative",
		display: "inline-block",
		maxWidth: "96vw",
		maxHeight: "92vh",
		cursor: "default"
	},
	lbImg: {
		display: "block",
		maxWidth: "96vw",
		maxHeight: "92vh",
		objectFit: "contain",
		borderRadius: "8px"
	},
	lbCloseWrap: {
		position: "fixed",
		top: "calc(var(--safe-area-top, 0px) + 18px)",
		right: "calc(env(safe-area-inset-right, 0px) + 18px)",
		zIndex: 1e4
	},
	lbClose: {
		width: "36px",
		height: "36px",
		borderRadius: "999px",
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center"
	},
	toastWrap: {
		position: "fixed",
		bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
		right: "calc(env(safe-area-inset-right, 0px) + 18px)",
		zIndex: 10001,
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		alignItems: "flex-end"
	},
	toast: {
		padding: "9px 13px",
		borderRadius: "9px",
		fontSize: "12.5px",
		fontWeight: 600,
		border: "1px solid var(--border)",
		background: "var(--card)",
		color: "var(--text)",
		boxShadow: "0 8px 24px rgba(0,0,0,.4)",
		maxWidth: "320px"
	}
};
// src/Motion.tsx
/**
* The app's two animations: a 1s linear spinner and the 2.2s ease-in-out sweep
* that crosses each screen while a critique runs.
*
* The built-in drew them with Framer Motion, which the dashboard bundles. This
* bundle cannot import the host's copy, so it drives the same keyframes through
* the Web Animations API (`Element.animate`), which needs no library and no CSS
* keyframe block.
*
* The reduced-motion behaviour is still driven by the app's own
* `useReduceMotion()`: the original CSS did not merely slow the animation down,
* it swapped the sweep for a flat tint (WCAG 2.3.3, which this app checks for as
* atom U18). Keeping the branch here preserves that exact substitution.
*/
/** Run `keyframes` on the element in `ref` for as long as it is mounted.
*  `key` names the animation, so a re-render with the same one keeps it running. */
function useLoop(ref, key, keyframes, options, active) {
	const spec = useRef({
		keyframes,
		options
	});
	spec.current = {
		keyframes,
		options
	};
	useEffect(() => {
		const el = ref.current;
		if (!active || !el || typeof el.animate !== "function") return;
		const animation = el.animate(spec.current.keyframes, spec.current.options);
		return () => animation.cancel();
	}, [
		ref,
		key,
		active
	]);
}
/** Spinner. Renders a still icon when the user asked for reduced motion. */
function Spinner({ size = 13, reduceMotion, style }) {
	const ref = useRef(null);
	useLoop(ref, "spin", [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
		duration: 1e3,
		easing: "linear",
		iterations: Infinity
	}, !reduceMotion);
	if (reduceMotion) return /* @__PURE__ */ jsx(Loader2, {
		size,
		style
	});
	return /* @__PURE__ */ jsx("span", {
		ref,
		style: {
			display: "inline-flex",
			lineHeight: 0,
			...style
		},
		children: /* @__PURE__ */ jsx(Loader2, { size })
	});
}
/**
* The scan sweep over one waiting screen. `index` staggers the screens so a flow
* reads as a sequence rather than one synchronised flash.
*/
function Sweep({ index, reduceMotion }) {
	const ref = useRef(null);
	useLoop(ref, `sweep-${index}`, [{ top: "-32%" }, { top: "100%" }], {
		duration: 2200,
		easing: "ease-in-out",
		iterations: Infinity,
		delay: index * 350
	}, !reduceMotion);
	if (reduceMotion) return /* @__PURE__ */ jsx("span", { style: S.sweepStill });
	return /* @__PURE__ */ jsx("span", {
		ref,
		style: {
			...S.sweep,
			top: "-32%"
		}
	});
}
// src/sendTurn.ts
/**
* The send-receipt contract this app needs from the dashboard's chat-core
* transport (`chat-core/transport/sendTurn.ts`), restated for a bundle: the
* dashboard module is not part of the App Kit, so the bundle cannot import it.
*
* One `POST /api/chat?ws=1` through a wire, bounded by `SEND_ABORT_MS`, and the
* answer read as a receipt. Never rejects; the caller branches on `status`:
*
* - `dispatched` / `queued`: the server took the message (`ok`, or `queued`).
* - `refused`: a non-2xx, a readable body with neither `ok` nor `queued`, or a
*   2xx an intermediary answered (a redirect that left `/api/chat` with a body
*   that is not JSON). Nothing was sent. `reason` is the server's explanation.
* - `unknown`: a 2xx whose body could not be read. The turn may well be running.
* - `response-late`: the deadline fired, or the wire said `indeterminate()`.
* - `transport-error`: the wire rejected with anything else.
*/
var SEND_ABORT_MS = 1e4;
/** A wire's "delivery is indeterminate" rejection: read as `response-late`. */
function indeterminate() {
	return new DOMException("aborted", "AbortError");
}
var CHAT_ENDPOINT_PATH = "/api/chat";
function answeredByIntermediary(response) {
	if (!response.redirected) return false;
	try {
		return new URL(response.url ?? "", "http://localhost").pathname !== CHAT_ENDPOINT_PATH;
	} catch {
		return true;
	}
}
async function readSendReceipt(response) {
	let parsed;
	try {
		parsed = await response.json();
	} catch {
		parsed = void 0;
	}
	const readable = !!parsed && typeof parsed === "object" && !Array.isArray(parsed);
	const body = readable ? parsed : {};
	if (!response.ok) return {
		body,
		outcome: "refused"
	};
	if (!readable) return {
		body,
		outcome: answeredByIntermediary(response) ? "refused" : "unknown"
	};
	if (body.ok || body.queued) return {
		body,
		outcome: "accepted"
	};
	return {
		body,
		outcome: "refused"
	};
}
async function sendTurn(opts) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SEND_ABORT_MS);
	try {
		const { body, outcome } = await readSendReceipt(await opts.wire({
			message: opts.message,
			slot: opts.slot
		}, controller.signal));
		if (outcome === "refused") return {
			status: "refused",
			body,
			reason: typeof body.error === "string" ? body.error : void 0
		};
		if (outcome === "unknown") return {
			status: controller.signal.aborted ? "response-late" : "unknown",
			body
		};
		return {
			status: body.ok && !body.queued ? "dispatched" : "queued",
			body
		};
	} catch (e) {
		if (e instanceof DOMException && e.name === "AbortError") return {
			status: "response-late",
			body: {}
		};
		return {
			status: "transport-error",
			body: {}
		};
	} finally {
		clearTimeout(timeout);
	}
}
// src/resizeImage.ts
/**
* Client-side image downscaling to fit the model's image limits.
*
* Vision models reject an entire prompt when an attached image is too large:
*   - dimensions over ~2000px on either side in a many-image request, and
*   - encoded payload over the per-image byte cap (~5MB).
*
* We downscale oversized raster images in the browser (built-in canvas) before
* upload, so the bytes that reach the server already fit. No server-side
* imaging dependency.
*/
/** Single source of truth for the image limits we enforce. */
var MODEL_IMAGE_LIMITS = {
	/** Long-edge target in px. 1568 stays comfortably under the 2000px
	*  many-image dimension cap. */
	maxEdge: 1568,
	/** Max encoded bytes per image. ~4.5MB keeps margin under the ~5MB cap. */
	maxBytes: 4718592
};
/** Raster formats the canvas can decode and re-encode. SVG (vector) and GIF
*  (animation) are intentionally excluded and passed through untouched. */
var RESIZABLE_MIME = /^image\/(png|jpeg|webp|bmp)$/i;
var MIN_EDGE = 256;
var MAX_ATTEMPTS = 6;
async function canvasToBlob(canvas, type, quality) {
	if ("convertToBlob" in canvas) try {
		return await canvas.convertToBlob({
			type,
			quality
		});
	} catch {
		return null;
	}
	return new Promise((resolve) => {
		canvas.toBlob((b) => resolve(b), type, quality);
	});
}
/** Draw the bitmap at w x h and encode to the given mime. Returns null on failure. */
async function renderToBlob(bitmap, w, h, mime, quality) {
	const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), {
		width: w,
		height: h
	});
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	ctx.drawImage(bitmap, 0, 0, w, h);
	return canvasToBlob(canvas, mime, quality);
}
/** Swap a filename's extension (e.g. shot.PNG -> shot.png). A name with no
*  extension gets one appended. */
function withExtension(name, ext) {
	return name.replace(/\.[^./\\]+$/, "") + "." + ext;
}
/**
* Return a downscaled copy of `file` if it is an oversized raster image (by
* dimension or by encoded byte size), otherwise return the original unchanged.
*
* Shrink strategy when the image is over budget:
*   1. Scale the long edge down to `maxEdge`.
*   2. If the encoded bytes still exceed `maxBytes`, switch PNG -> JPEG (big
*      win for screenshots), then step the edge down until it fits.
*
* Always degrades gracefully: a non-image, an undecodable file, an unsupported
* format, a missing `createImageBitmap`, or any canvas failure returns the
* original file so the upload still proceeds.
*/
async function resizeImageForModel(file, limits = MODEL_IMAGE_LIMITS) {
	const asIs = {
		file,
		info: null
	};
	if (!RESIZABLE_MIME.test(file.type)) return asIs;
	if (typeof createImageBitmap !== "function") return asIs;
	let bitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return asIs;
	}
	try {
		const { width, height } = bitmap;
		const longEdge = Math.max(width, height);
		const overDim = longEdge > limits.maxEdge;
		const overBytes = file.size > limits.maxBytes;
		if (!overDim && !overBytes) return asIs;
		let edge = Math.min(longEdge, limits.maxEdge);
		let useJpeg = /jpeg/i.test(file.type);
		let best = null;
		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			const scale = edge / longEdge;
			const w = Math.max(1, Math.round(width * scale));
			const h = Math.max(1, Math.round(height * scale));
			const mime = useJpeg ? "image/jpeg" : "image/png";
			const blob = await renderToBlob(bitmap, w, h, mime, useJpeg ? .9 : void 0);
			if (!blob) break;
			best = {
				blob,
				w,
				h,
				mime
			};
			if (blob.size <= limits.maxBytes) break;
			if (!useJpeg) useJpeg = true;
			else edge = Math.max(MIN_EDGE, Math.round(edge * .85));
		}
		if (!best || best.blob.size > limits.maxBytes) return asIs;
		const out = new File([best.blob], withExtension(file.name, best.mime === "image/jpeg" ? "jpg" : "png"), {
			type: best.mime,
			lastModified: Date.now()
		});
		return {
			file: out,
			info: {
				name: file.name,
				fromW: width,
				fromH: height,
				toW: best.w,
				toH: best.h,
				fromBytes: file.size,
				toBytes: out.size
			}
		};
	} catch {
		return asIs;
	} finally {
		bitmap.close?.();
	}
}
// src/composerUpload.ts
/**
* The composer upload body (`POST /api/upload/file`): oversized raster images are
* downscaled in the browser first (`resizeImage.ts`, copied from the dashboard),
* then posted as one multipart body whose `paths` answer lists one stored path
* per file, in order.
*
* The dashboard's own composer also converts a HEIC/HEIF photo to JPEG before
* it uploads. That converter is not part of the App Kit, so here a HEIC photo is
* uploaded as it is (PORTING.md, "Remaining gaps").
*/
var COMPOSER_UPLOAD_PATH = "/api/upload/file";
/** Upload `files` through `post`, which sends the multipart body and returns the
*  response. A refusal is returned as `error` or thrown by `post`; a transport
*  error propagates. */
async function uploadComposerFiles(files, post) {
	const prepared = [];
	for (const f of files) prepared.push(await resizeImageForModel(f));
	const resized = prepared.map((p) => p.info).filter((i) => i !== null);
	const fd = new FormData();
	prepared.forEach((p) => fd.append("file", p.file));
	const res = await post(fd);
	let body;
	try {
		body = await res.json();
	} catch {
		body = {};
	}
	if (!res.ok) return {
		paths: [],
		error: body.error || res.statusText,
		resized
	};
	if (!Array.isArray(body.paths)) return {
		paths: [],
		error: t("common.unexpected_server_response"),
		resized
	};
	return {
		paths: body.paths,
		resized
	};
}
// src/api.ts
var DC = "/api/apps/design-critique";
/** Every request below goes through the host's scoped client (`useAppApi().raw`,
*  bound at the page root by `bindAppApi`), so a path outside the manifest's
*  `permissions.api` is refused in the browser before it is sent. `raw` resolves
*  only a 2xx and throws the host's typed error (`status`, `body`) otherwise. */
async function hostFetch(path, init) {
	return currentAppApi().raw(path, {
		credentials: "same-origin",
		...init
	});
}
/** The transport's fetch seam for this app's sends: one plain same-origin
*  `POST /api/chat?ws=1` (the JSON receipt, not the SSE stream) carrying the
*  slot-recreation fields `send` documents, resolving on every HTTP status so
*  the shared classifier reads a 4xx/5xx as a refusal, and honouring the
*  transport's deadline signal. A rejected fetch is INDETERMINATE, per the
*  `SendWire` contract: "never left" and "the gateway took the POST and the
*  connection reset before headers" are the same rejection from here, and the
*  second means a retry runs the critique twice -- so the wire says
*  `indeterminate()` (→ `response-late`, which `send` resolves and the poll
*  settles) rather than passing the raw error through as a retry-safe
*  `transport-error`. This app has no optimistic bubble and no composer, so
*  the dashboard wire's exemption does not apply to it. */
var critiqueSendWire = async (payload, signal) => {
	try {
		return await hostFetch("/api/chat?ws=1", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: payload.message,
				slot: payload.slot,
				agent: AGENT,
				memory_mode: "temporary",
				mode: "design-critique"
			}),
			signal
		});
	} catch (e) {
		if (typeof e?.status === "number") {
			const body = String(e.body ?? "");
			return {
				ok: false,
				json: async () => JSON.parse(body)
			};
		}
		throw indeterminate();
	}
};
async function jsonFetch(path, init) {
	let r;
	try {
		r = await hostFetch(path, init);
	} catch (e) {
		throw toApiError(e);
	}
	if (r.status === 204 || r.status === 205) return void 0;
	const text = await r.text();
	if (text.trim() === "") return void 0;
	return JSON.parse(text);
}
var postJson = (path, body) => jsonFetch(path, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: body != null ? JSON.stringify(body) : void 0
});
var isJobHandle = (x) => !!x && typeof x.job === "string";
async function pollJob(base, jobId) {
	let misses = 0;
	for (;;) {
		await new Promise((r) => setTimeout(r, 1500));
		let r;
		try {
			r = await jsonFetch(base + "?job=" + encodeURIComponent(jobId));
		} catch (e) {
			if (++misses >= 8) throw e instanceof Error ? e : /* @__PURE__ */ new Error("lost contact with the scan");
			continue;
		}
		misses = 0;
		if (r.status === "running") continue;
		if (r.status === "error") throw new Error(r.error || "that run did not finish");
		return r.result;
	}
}
var designCritiqueApi = {
	openSlot: () => postJson("/api/chat/slots", {
		name: "dc-" + Date.now(),
		agent: AGENT,
		memory_mode: "temporary",
		mode: "design-critique"
	}),
	getSlot: (slotKey) => jsonFetch("/api/chat/slots/" + encodeURIComponent(slotKey)),
	send: async (slotKey, message) => {
		const receipt = await sendTurn({
			message,
			slot: slotKey,
			wire: critiqueSendWire
		});
		if (receipt.status === "refused") throw new Error(receipt.reason || t("common.send_failed"));
	},
	deleteSlot: (slotKey) => jsonFetch("/api/chat/slots/" + encodeURIComponent(slotKey), { method: "DELETE" }).catch(() => {}),
	uploadFiles: async (files) => {
		const res = await uploadComposerFiles(files, async (body) => {
			try {
				return await hostFetch(COMPOSER_UPLOAD_PATH, {
					method: "POST",
					body
				});
			} catch (e) {
				throw toApiError(e);
			}
		});
		if (res.error !== void 0) throw new Error(res.error);
		return { paths: res.paths };
	},
	discover: async (kind, value, onJob) => {
		const started = await postJson(DC + "/discover", {
			kind,
			value
		});
		if (isJobHandle(started)) {
			onJob?.(started.job);
			return pollJob(DC + "/discover", started.job);
		}
		return started;
	},
	pollDiscover: (jobId) => pollJob(DC + "/discover", jobId),
	render: (body, onJob) => postJson(DC + "/render", body).then((started) => {
		onJob?.(started.job);
		return pollJob(DC + "/render", started.job);
	}),
	pollRender: (jobId) => pollJob(DC + "/render", jobId),
	method: () => jsonFetch(DC + "/method")
};
var fileUrl = (p) => "/api/file-raw?path=" + encodeURIComponent(p);
// src/utils.ts
function detectKind(raw) {
	const s = String(raw || "").trim();
	if (!s) return null;
	if (/^https?:\/\/(www\.)?figma\.com\//i.test(s)) return {
		kind: "figma",
		value: s
	};
	const repo = /^(https?:\/\/)?(www\.)?((github\.com|gitlab\.com|bitbucket\.(?:org|com))\/[^/]+\/[^/]+[\s\S]*)$/i.exec(s);
	if (repo) return {
		kind: "repo",
		value: (repo[1] || "https://") + repo[3]
	};
	const loopback = (u) => u.replace(/^(https?:\/\/)?0\.0\.0\.0(?=[:/?#]|$)/i, "$1127.0.0.1");
	if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?/i.test(s)) return {
		kind: "url",
		value: loopback(s),
		local: true
	};
	if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+|(?=[/?#]|$))/i.test(s)) return {
		kind: "url",
		value: "http://" + loopback(s),
		local: true
	};
	if (/^https?:\/\//i.test(s)) return {
		kind: "url",
		value: s
	};
	if (/^(\/|~\/|\.\/)/.test(s) || /^[a-zA-Z]:[\\/]/.test(s) || /^\\\\[^\\]+\\/.test(s)) return {
		kind: "local",
		value: s
	};
	return {
		kind: "unknown",
		value: s
	};
}
function recognise(det) {
	if (!det) return null;
	switch (det.kind) {
		case "figma": return {
			ok: true,
			text: t("utils.i_ll_pull_the_frames")
		};
		case "repo": return {
			ok: true,
			text: t("utils.i_ll_clone_it_and_list_the_screens_only_pages_th")
		};
		case "local": return {
			ok: true,
			text: t("utils.i_ll_list_the_screens_only_pages_that_render_wit")
		};
		case "url": return det.local ? {
			ok: true,
			text: t("utils.it_must_be_running_right_now_i_ll_capture_it_liv")
		} : {
			ok: true,
			text: t("utils.i_ll_capture_it_and_measure_real_contrast_and_si")
		};
		default: return {
			ok: false,
			text: t("utils.not_something_i_recognise_give_me_a_figma_link_a")
		};
	}
}
/**
* Every balanced `{…}` span in `t`, outermost only, in the order they appear.
*
* Quote- and escape-aware INSIDE an object, so a brace in a string value
* (`"fix":"drop the {primary} token"`) does not move the depth counter and
* cannot split a span.
*
* Outside one — at depth 0 — a quote is ignored on purpose. Prose is not JSON,
* so its quotes do not pair: a reply opening `Here is "the report:` leaves one
* unmatched quote, and tracking it there would put the scanner in string mode
* for everything after, swallowing the report's own braces and emitting no span
* at all. That is the failure this whole function exists to prevent, so string
* mode begins only once an object is open.
*/
function braceSpans(t) {
	const out = [];
	let depth = 0, start = -1, inStr = false, esc = false;
	for (let i = 0; i < t.length; i++) {
		const ch = t[i];
		if (inStr) {
			if (esc) {
				esc = false;
				continue;
			}
			if (ch === "\\") {
				esc = true;
				continue;
			}
			if (ch === "\"") inStr = false;
			continue;
		}
		if (ch === "\"") {
			if (depth > 0) inStr = true;
			continue;
		}
		if (ch === "{") {
			if (depth === 0) start = i;
			depth++;
			continue;
		}
		if (ch === "}" && depth > 0 && --depth === 0 && start >= 0) {
			out.push(t.slice(start, i + 1));
			start = -1;
		}
	}
	return out;
}
/**
* Pull the critic's JSON out of a reply.
*
* The contract asks for JSON and nothing else, and a reply that honours it
* parses either way. But the tolerance this function already extends to the
* usual model wrapping — a ```json fence, a line of prose either side — used to
* break on a wrapper that merely CONTAINED a brace, because it sliced from the
* first `{` to the last `}` and handed whatever lay between to `JSON.parse`.
* A reply that closed with "tweak the `{primary}` token", or opened by naming
* the `{schema}` it was given, therefore threw away a complete report and the
* run ended on "not in a readable format".
*
* So consider every balanced span instead of one blind slice, and take the
* largest that parses — the report is the substantive object in the reply, not
* the aside next to it. This is strictly more tolerant than the slice: any text
* the slice accepted still parses. A reply carrying no JSON at all still returns
* null, which is the honest case the error message exists for.
*
* `accept` filters the candidates rather than vetoing the winner, and that
* distinction is the whole point of taking it here. Judging only the largest
* span and rejecting it outside this function would end the search at the first
* unrecognised object, so a reply carrying a bigger unrelated object beside a
* real report would lose the report — the same discard this function exists to
* prevent. Rejection therefore continues to the next span.
*/
function extractJson(text, accept) {
	if (!text) return null;
	const spans = braceSpans(String(text).replace(/```json\s*/gi, "").replace(/```/g, "").trim()).sort((a, b) => b.length - a.length);
	for (const s of spans) {
		let parsed;
		try {
			parsed = JSON.parse(s);
		} catch {
			continue;
		}
		if (!accept || accept(parsed)) return parsed;
	}
	return null;
}
/**
* Does this parsed object look like a critique report, rather than a fragment of
* one or something else that happens to share a key name?
*
* Needed because a JSON object is not self-identifying. A stream cut short right
* before a nested object leaves a continuation row that parses PERFECTLY on its
* own — split the schema before `{"severity":…}` and the suffix is a complete,
* valid finding object — so "it parsed" cannot mean "it is the report". Accepting
* one would be worse than the error it replaced: `normalizeReport` coerces the
* fragment into a report with nothing in it, `finishReport` writes that blank
* critique to history, and `endRun` then deletes the slot holding the real one.
*
* The test is TYPED, not a key-presence check, and that distinction carries the
* guarantee. A key name alone is cheap for unrelated JSON to satisfy — an object
* holding `findings` as a long STRING passes a presence test, and being longer
* than the real report it would then be preferred over it, losing the critique to
* exactly the blank-render path above. So each field must arrive as the type the
* UI renders it as, which is the same shape `normalizeReport` coerces to
* downstream: prose as a string, lists as arrays, the tally as an object.
*
* Any ONE correctly-typed field is enough. A real report carries several, while a
* sparse one should still render rather than be discarded — requiring a full
* schema here would reintroduce the original bug in a stricter disguise.
*/
function looksLikeReport(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const v = value;
	const isText = (k) => typeof v[k] === "string";
	const isList = (k) => Array.isArray(v[k]);
	const isObj = (k) => !!v[k] && typeof v[k] === "object" && !Array.isArray(v[k]);
	return isText("overallRead") || isText("health") || isObj("tally") || isList("screens") || isList("findings") || isList("keep") || isList("couldNotSee");
}
/**
* The report from a finished turn, wherever in that turn it landed.
*
* One turn is not one message. The runner finalizes a segment per text block
* (`_flush_segment`), so text either side of a tool group arrives as two
* `assistant` rows, and a stream interrupted by a transient backend error is
* persisted as a partial row plus a continuation row — the model is told to
* carry on where it stopped, which for this prompt means resuming mid-JSON.
* Reading only the newest row therefore discarded a report the critic really
* did produce: a trailing remark after the JSON, or either half of a split one,
* failed to parse and the run ended on "not in a readable format".
*
* So try each assistant row newest-first, then the rows joined in order, which
* is what reassembles a split reply. Order matters: newest-first keeps the last
* report authoritative when a turn somehow produced two, and the join is only
* reached when no single row carries one.
*
* `accept` is what makes that order safe. Without it the newest-first pass is a
* trap on exactly the split it exists to repair — a continuation beginning at a
* nested object parses alone, and would be taken for the whole report before the
* join ever ran. It is handed to `extractJson` rather than applied to its result,
* so an unrecognised candidate is skipped WITHIN a row's span search and the next
* span still gets its turn; vetoing the result here would abandon a row whose
* report merely sat behind a larger object.
*/
function jsonFromMessages(messages, accept) {
	if (!Array.isArray(messages)) return null;
	const rows = messages.filter((m) => {
		const role = m.role || m.type;
		return role === "assistant" || role === "msg msg-a";
	}).map((m) => m.content || "").filter((c) => !!c.trim());
	for (let i = rows.length - 1; i >= 0; i--) {
		const p = extractJson(rows[i], accept);
		if (p) return p;
	}
	return rows.length > 1 ? extractJson(rows.join(""), accept) : null;
}
function lastAssistant(messages) {
	if (!Array.isArray(messages)) return "";
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		const role = m.role || m.type;
		if ((role === "assistant" || role === "msg msg-a") && (m.content || "").trim()) return m.content || "";
	}
	return "";
}
function shortLabel(s) {
	const t$3 = String(s || "").replace(/\s*[([].*?[)\]]\s*/g, " ").replace(/\s+/g, " ").trim();
	if (!t$3) return t("utils.screen_fallback");
	return t$3.length > 18 ? t$3.slice(0, 17).trimEnd() + "…" : t$3;
}
/**
* Relative age of a critique run, through the shared formatting seam.
*
* Uses narrow `fmtRelative` rather than gluing a unit onto a number (`s + 's ago'`),
* which is untranslatable and is what `src/i18n/unitLiterals.test.ts` gates.
* `fmtRelative` is byte-identical in English for seconds, minutes, hours and
* multi-day gaps; the two deliberate deltas documented on the seam apply here too
* (a sub-second age reads `now` rather than `1s ago`, and exactly one day back reads
* `yesterday`), and it truncates rather than rounds so an age never reads as further
* in the past than it is.
*/
function relTime(ts) {
	return fmtRelative(ts);
}
function resolveScreens(rep, uploaded) {
	return (uploaded || []).map((u, i) => ({
		step: i + 1,
		label: rep.screens && rep.screens[i] && rep.screens[i].label || u.label,
		url: u.url
	}));
}
var loadHistory = () => {
	try {
		return JSON.parse(localStorage.getItem("dc-history-v1") || "[]");
	} catch {
		return [];
	}
};
/**
* Show an in-flight run in the critique list. Called when `+ New` backgrounds a
* running critique: the run keeps going, so it needs a visible home rather than
* disappearing until it happens to finish. Carries no report yet — `finishReport`
* fills this same row in place so it never jumps position.
*/
var beginPendingCritique = (slotKey, screens) => {
	const cur = loadHistory();
	if (!slotKey || cur.some((e) => e.slotKey === slotKey)) return cur;
	const next = [{
		id: Date.now(),
		ts: Date.now(),
		slotKey,
		screens: screens || [],
		thumbUrl: screens && screens[0] ? screens[0].url : "",
		read: "",
		report: null,
		pending: true
	}, ...cur];
	saveHistory(next);
	return next;
};
/** Remove the placeholder for a run that failed, so no dead row is left behind. */
var dropPendingCritique = (slotKey) => {
	const cur = loadHistory();
	const next = cur.filter((e) => !(e.slotKey === slotKey && e.pending));
	if (next.length !== cur.length) saveHistory(next);
	return next;
};
var saveHistory = (list) => {
	try {
		localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 24)));
	} catch {}
};
/**
* Job records are keyed by slotKey, because more than one critique can be in
* flight at once: `+ New` deliberately does NOT cancel a running run, so a
* single shared record would let starting a second critique overwrite the first
* one's resume pointer — leaving the first run with nowhere to resume from and
* its result lost on navigation, even though the reaper spares its slot. Storing
* one record per slot keeps every in-flight run resumable.
*
* The value is read as an object but tolerates the older single-record shape
* written by a previous build, so an upgrade in mid-run still resumes.
*/
var loadJobs = () => {
	try {
		const raw = JSON.parse(localStorage.getItem("dc-current-job") || "null");
		if (!raw || typeof raw !== "object") return [];
		if (typeof raw.slotKey === "string") return [raw];
		return Object.values(raw).filter((j) => !!j && typeof j === "object" && typeof j.slotKey === "string").sort((a, b) => (b.ts || 0) - (a.ts || 0));
	} catch {
		return [];
	}
};
var saveJob = (j) => {
	if (!j || !j.slotKey) return;
	try {
		const byslot = {};
		for (const e of loadJobs()) byslot[e.slotKey] = e;
		byslot[j.slotKey] = j;
		localStorage.setItem(JOBKEY, JSON.stringify(byslot));
	} catch {}
};
/** Drop one run's record, or every record when called with no slot. */
var clearJob = (slotKey) => {
	try {
		if (!slotKey) {
			localStorage.removeItem(JOBKEY);
			return;
		}
		const byslot = {};
		for (const e of loadJobs()) if (e.slotKey !== slotKey) byslot[e.slotKey] = e;
		if (Object.keys(byslot).length) localStorage.setItem(JOBKEY, JSON.stringify(byslot));
		else localStorage.removeItem(JOBKEY);
	} catch {}
};
var loadSlots = () => {
	try {
		return JSON.parse(localStorage.getItem("dc-open-slots-v1") || "[]");
	} catch {
		return [];
	}
};
var saveSlots = (l) => {
	try {
		localStorage.setItem(SLOTSKEY, JSON.stringify(l.slice(-20)));
	} catch {}
};
var trackSlot = (k) => {
	if (k) saveSlots(loadSlots().filter((x) => x !== k).concat([k]));
};
var untrackSlot = (k) => {
	saveSlots(loadSlots().filter((x) => x !== k));
};
/**
* Foreground for text sitting on a solid severity colour.
*
* The severity palette runs from a dark red to a light yellow, so no single
* hardcoded foreground stays legible across it: white on the Minor yellow
* (#e2c541) measures about 1.9:1, well under the 4.5:1 WCAG 1.4.3 floor that
* the 11px badge and pin text needs. Pick per-colour from relative luminance.
*/
function readableOn(hex) {
	const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex).trim());
	if (!m) return "#fff";
	const n = parseInt(m[1], 16);
	const lin = [
		n >> 16 & 255,
		n >> 8 & 255,
		n & 255
	].map((v) => {
		const c = v / 255;
		return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
	});
	const lum = .2126 * lin[0] + .7152 * lin[1] + .0722 * lin[2];
	return (lum + .05) / .05 > 1.05 / (lum + .05) ? "#12141a" : "#fff";
}
/**
* Coerce a model-supplied report into the shape the UI renders.
*
* `extractJson<Report>` is an unchecked cast over model output, so every array
* field is only *probably* an array. Guarding each render site one at a time is
* fragile — the same bug class recurs (`steps` arriving as `"1"`, `keep` /
* `couldNotSee` / `rules` as non-arrays), and the failure is worse than a blank
* section: the throw happens during render, the route-level ErrorBoundary
* replaces the page, and because the entry is written to history first, reopening
* that critique crashes every time.
*
* So normalise once, here, at the boundary. Anything that should be a list and
* is not becomes an empty list; a wrong-shaped field costs a missing section
* instead of an unrecoverable page.
*/
function normalizeReport(raw) {
	if (!raw || typeof raw !== "object") return null;
	const strings = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string" && !!x.trim()) : [];
	const objects = (v) => Array.isArray(v) ? v.filter((x) => !!x && typeof x === "object" && !Array.isArray(x)) : [];
	const numbers = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "number" && Number.isFinite(x)) : [];
	const text = (v) => typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : void 0;
	return {
		...raw,
		overallRead: text(raw.overallRead),
		health: text(raw.health),
		screens: objects(raw.screens).map((sc) => ({
			...sc,
			label: text(sc?.label),
			path: text(sc?.path)
		})),
		keep: strings(raw.keep),
		couldNotSee: strings(raw.couldNotSee),
		findings: objects(raw.findings).map((f) => ({
			...f,
			title: text(f?.title) || "",
			category: text(f?.category),
			location: text(f?.location),
			evidence: text(f?.evidence),
			fix: text(f?.fix),
			steps: numbers(f?.steps),
			rules: strings(f?.rules)
		}))
	};
}
/**
* Coerce a model-supplied discovery payload into the shape the picker renders.
*
* Same class as normalizeReport, one layer out: guarding `Array.isArray(flows)`
* proves the container is a list but says nothing about its ELEMENTS, so a reply
* of `flows:[null]` still crashed when the picker read `f.screenIds`. Filter to
* real objects and make every nested list a list, at the one place the payload
* enters the app.
*/
function normalizeScope(raw) {
	if (!raw || typeof raw !== "object") return null;
	const objects = (v) => Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
	const strings = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
	const text = (v) => typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : void 0;
	const blocked = raw.blocked && typeof raw.blocked === "object" && !Array.isArray(raw.blocked) ? {
		...raw.blocked,
		reason: text(raw.blocked.reason) || "",
		detail: text(raw.blocked.detail)
	} : null;
	return {
		framework: text(raw.framework),
		note: text(raw.note),
		blocked,
		screens: objects(raw.screens).filter((s) => typeof s.id === "string" && !!s.id).map((s) => ({
			id: s.id,
			label: text(s.label) || s.id,
			ref: text(s.ref),
			group: text(s.group),
			why: text(s.why),
			canSee: typeof s.canSee === "boolean" ? s.canSee : void 0
		})),
		flows: objects(raw.flows).map((f) => ({
			label: text(f.label),
			why: text(f.why),
			screenIds: strings(f.screenIds)
		})),
		cannotSee: strings(raw.cannotSee)
	};
}
var readLive = () => {
	try {
		const raw = JSON.parse(localStorage.getItem("dc-live-runs-v1") || "[]");
		if (!Array.isArray(raw)) return [];
		const now = Date.now();
		return raw.filter((r) => !!r && typeof r === "object" && typeof r.k === "string" && !!r.k && now - (typeof r.ts === "number" ? r.ts : 0) < 18e5);
	} catch {
		return [];
	}
};
var writeLive = (l) => {
	try {
		localStorage.setItem(LIVEKEY, JSON.stringify(l.slice(-20)));
	} catch {}
};
/** Slot keys whose run is still in flight (expired entries dropped). */
var loadLive = () => readLive().map((r) => r.k);
var markLive = (k) => {
	if (!k) return;
	writeLive(readLive().filter((r) => r.k !== k).concat([{
		k,
		ts: Date.now()
	}]));
};
var unmarkLive = (k) => {
	if (!k) return;
	writeLive(readLive().filter((r) => r.k !== k));
};
// src/fileTokens.ts
/**
* `mdImageDest`, copied from the dashboard's `utils/fileTokens.ts`: a stored
* upload path as a CommonMark image destination. A path in the plain-safe subset
* is used as is; anything else is wrapped in `<…>` with `%`, `\`, `<` and `>`
* escaped, so a space or a parenthesis in a file name cannot end the link early.
* A Windows-shaped path (drive letter or UNC) is first spelled with forward
* slashes, as the dashboard does for paths its upload endpoint returns.
*/
var WINDOWS_SHAPED_PATH_RE = /^(?:[A-Za-z]:|\\\\[^\\/]+)[\\/]/;
function normalizeWindowsPath(p) {
	return WINDOWS_SHAPED_PATH_RE.test(p) ? p.replace(/\\/g, "/") : p;
}
function mdImageDest(p) {
	const normalized = normalizeWindowsPath(p);
	if (/^[\w/.@:~-]*$/.test(normalized) && !normalized.includes("%")) return normalized;
	return `<${normalized.replace(/%/g, "%25").replace(/[\\<>]/g, (c) => "\\" + c)}>`;
}
// src/prompts.ts
/**
* The critic persona and method, carried by the prompt rather than by an agent.
*
* A bundled `design-critic` agent cannot be used from a builtin: a builtin
* manifest may declare `agents`, but discovery never serializes that field and
* `bridges.py` resolves an app root under the user data dir, where a builtin has
* only `app.json`. The agent is therefore never registered, and naming it on
* `/api/chat` fails every request. (`dev_fleet` has the same latent gap with its
* two declared skills, neither of which is registered today.) So the persona,
* the voice rules and the method live here and run on the core agent.
*/
var CRITIC = "You are an experienced designer running a heuristic design critique — a fellow designer looking over someone’s work, not a title on a review panel.\n\nVoice: lead with a one-line overall read and a health tally using the NN/g severity names (Cosmetic / Minor / Major / Catastrophe), then what is working, then the top 3-5 things you would tighten (element → problem → fix), then one line on what the evidence could not show. Positives before fixes. No composite 0-100 score. Be warm, specific and concrete. Do not invent personas or backstories to justify a finding. Never judge what the supplied evidence cannot reveal, and never critique visuals from unrendered source.\n\n";
var SCHEMA = (multi) => "Return ONLY JSON (no prose, no code fences) matching exactly:\n{\"overallRead\":string,\"health\":string,\"tally\":{\"catastrophe\":int,\"major\":int,\"minor\":int,\"cosmetic\":int},\"screens\":[{\"step\":int,\"label\":string,\"path\":string}],\"findings\":[{\"severity\":\"cosmetic|minor|major|catastrophe\",\"title\":string,\"category\":string,\"scope\":\"screen|flow\",\"steps\":[int],\"location\":string,\"evidence\":string,\"fix\":string,\"rules\":[string],\"box\":{\"x\":number,\"y\":number,\"w\":number,\"h\":number}}],\"keep\":[string],\"couldNotSee\":[string]}\n\n\"screens\" lists every screen you actually saw, in order, with the absolute image path for each. \"box\" is the APPROXIMATE region of the issue within ITS screen as fractions 0-1 (x,y = top-left, w,h = size); use null if you cannot localize it.\n\n" + (multi ? "Set \"scope\" to \"screen\" for a finding that lives on one screen (put that one step in \"steps\", and give a box). Set \"scope\" to \"flow\" for a problem that only exists because this is a sequence — inconsistency between steps, no progress indicator, no way back, repeated asks, dead ends. List every step it involves in \"steps\" and use null for \"box\". Count a cross-screen problem once, not once per screen.\n\n" : "Use \"scope\":\"screen\" and \"steps\":[1] for every finding.\n\n") + "In \"rules\", name the 1-3 design principles or heuristics the finding rests on (e.g. “Nielsen: consistency”, “Gestalt: proximity”, “WCAG 1.4.3 contrast”).\n\nPhrase \"fix\" as a suggestion (“Consider…”, “One option…”, “You might…”), not a command, for every finding EXCEPT accessibility — accessibility fixes may be stated directly.\n\nOnly include findings for what you actually saw. List anything you could not see under \"couldNotSee\" instead of guessing.";
var IMAGES_PROMPT = (paths, brief, method, couldNotRender) => {
	const multi = paths.length > 1;
	return CRITIC + (method ? "Follow this critique method exactly:\n\n" + method + "\n\n" : "") + (multi ? "Please critique this flow of " + paths.length + " screens, in the order given. Run your design-critique skill in FLOW MODE: walk each step in order (what is this screen asking the user to do, is the next action obvious, what happens between this screen and the next, where is the friction), then check the jumps between steps. Do not narrate what each screen contains." : "Please run a design critique on this screenshot.") + (brief ? " Context: " + brief + "." : "") + "\n\n" + (couldNotRender && couldNotRender.length ? "These screens could not be rendered — list them under couldNotSee: " + couldNotRender.join(", ") + ".\n\n" : "") + SCHEMA(multi) + "\n\nThe screens, in order:\n" + paths.map((p, i) => (multi ? "Step " + (i + 1) + ":\n" : "") + "![screen](" + mdImageDest(p) + ")").join("\n\n") + "\n\nFor \"screens\", use these exact paths in this order: " + JSON.stringify(paths) + ". Give each a label of ONE or TWO plain words naming the screen (e.g. \"Cart\", \"Shipping\", \"Payment\", \"Confirmation\"). No parentheses, no state descriptions, max 18 characters.";
};
var ASK_CONTEXT = (rep, screens) => "Context — you already produced this critique. Do NOT re-critique anything; the user just wants to understand parts of it.\n\nOverall read: " + (rep.overallRead || "") + "\nScreens: " + (screens || []).map((s, i) => i + 1 + ". " + (s.label || "Screen")).join(", ") + "\n\nFindings:\n" + (rep.findings || []).map((f, i) => i + 1 + ". [" + f.severity + "] " + f.title + (f.evidence ? " — evidence: " + f.evidence : "") + (f.fix ? " — suggested: " + f.fix : "") + (f.rules && f.rules.length ? " — based on: " + f.rules.join("; ") : "")).join("\n") + "\n\nReply \"ready\" and nothing else.";
var ASK_PROMPT = (quote, question) => "The user highlighted this from your critique:\n\n“" + quote + "”\n\nTheir question: " + (question || "What does this mean?") + "\n\nAnswer in 2-4 plain sentences, as a designer explaining to another designer. Explain the reasoning or the principle behind it and what they would actually change. No headings, no bullet lists, no restating the question. If the honest answer is that you are not sure or the evidence did not show it, say that plainly.";
// src/hooks.ts
var REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function motionQuery() {
	return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION) : null;
}
function useReduceMotion() {
	const [reduced, setReduced] = useState(() => motionQuery()?.matches ?? false);
	useEffect(() => {
		const mq = motionQuery();
		if (!mq) return;
		const onChange = () => setReduced(mq.matches);
		onChange();
		mq.addEventListener?.("change", onChange);
		return () => mq.removeEventListener?.("change", onChange);
	}, []);
	return reduced;
}
function useNarrow(ref) {
	const [narrow, setNarrow] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver((es) => setNarrow(es[0].contentRect.width < 760));
		ro.observe(el);
		return () => ro.disconnect();
	}, [ref]);
	return narrow;
}
function useToasts() {
	const [toasts, setToasts] = useState([]);
	const idRef = useRef(0);
	return {
		toasts,
		notify: useCallback((message, opts) => {
			const id = ++idRef.current;
			setToasts((prev) => prev.concat([{
				id,
				msg: message,
				type: opts?.type || "info"
			}]));
			setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5e3);
		}, [])
	};
}
// src/FindingRow.tsx
function FindingRow({ finding: f, isOpen, isActive, flowScoped, pinNum, stepRange, withMarks, onEnter, onLeave, onClick, rowRef }) {
	const s = sevOf(f.severity);
	const Icon = s.icon;
	return /* @__PURE__ */ jsxs("div", {
		ref: rowRef,
		role: "presentation",
		style: {
			...S.finding,
			borderBottom: isActive ? "1px solid transparent" : "1px solid var(--border)",
			background: isActive ? "var(--card)" : "transparent",
			boxShadow: isActive ? "inset 3px 0 0 " + s.color : "none",
			borderRadius: isActive ? "8px" : "0"
		},
		onMouseEnter: onEnter,
		onMouseLeave: onLeave,
		children: [/* @__PURE__ */ jsxs(Clickable, {
			style: S.fRow,
			onClick,
			children: [flowScoped ? /* @__PURE__ */ jsx("span", {
				style: {
					...S.flowBadge,
					background: s.color,
					color: readableOn(s.color)
				},
				children: stepRange || t("findingRow.flow_badge")
			}) : /* @__PURE__ */ jsx("span", {
				style: {
					...S.numBadge,
					background: s.color,
					color: readableOn(s.color),
					marginTop: "1px"
				},
				children: String(pinNum || "·")
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					flex: 1,
					minWidth: 0
				},
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "flex-start",
						gap: "10px"
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: S.fTitle,
						children: withMarks(f.title || t("findingRow.finding"))
					}), /* @__PURE__ */ jsx(ChevronRight, {
						size: 15,
						style: {
							flexShrink: 0,
							marginTop: "2px",
							transform: isOpen ? "rotate(90deg)" : "none",
							transition: "transform .15s",
							color: "var(--muted)"
						}
					})]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: "8px",
						marginTop: "7px",
						flexWrap: "wrap"
					},
					children: [
						/* @__PURE__ */ jsxs("span", {
							style: {
								...S.sevPill,
								color: s.color,
								borderColor: s.color
							},
							children: [/* @__PURE__ */ jsx(Icon, { size: 12 }), s.label]
						}),
						f.category ? /* @__PURE__ */ jsx("span", {
							style: S.fMeta,
							children: f.category
						}) : null,
						flowScoped && stepRange ? /* @__PURE__ */ jsx("span", {
							style: S.fMeta,
							children: "· " + t("findingRow.steps_range", { range: stepRange })
						}) : null
					]
				})]
			})]
		}), isOpen ? /* @__PURE__ */ jsxs("div", {
			style: S.fBody,
			children: [
				f.location ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("span", {
					style: S.fLabel,
					children: [t("findingRow.where"), " "]
				}), f.location] }) : null,
				f.evidence ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					style: S.fLabel,
					children: t("findingRow.what_i_saw")
				}), withMarks(f.evidence)] }) : null,
				f.fix ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					style: S.fLabel,
					children: /accessib/i.test(f.category || "") ? t("findingRow.fix") : t("findingRow.suggestion")
				}), withMarks(f.fix)] }) : null,
				Array.isArray(f.rules) && f.rules.length ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					style: S.fLabel,
					children: t("findingRow.based_on")
				}), /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						gap: "6px",
						flexWrap: "wrap",
						marginTop: "4px"
					},
					children: f.rules.map((r, ri) => /* @__PURE__ */ jsx("span", {
						style: S.ruleBadge,
						children: r
					}, ri))
				})] }) : null
			]
		}) : null]
	});
}
// src/WaitingScreen.tsx
function WaitingScreen({ phase, elapsed, writing, reduceMotion, screens, pendingKind, onCancel }) {
	let stageIdx = 0;
	for (let i = 0; i < STAGES.length; i++) if (elapsed >= STAGES[i].at) stageIdx = i;
	if (phase === "uploading" || phase === "scanning") stageIdx = 0;
	const list = phase === "scanning" ? SCAN_STAGES : [...STAGES, {
		at: Number.POSITIVE_INFINITY,
		label: WRITING_STAGE.label
	}];
	const activeIdx = writing ? list.length - 1 : stageIdx;
	const many = screens.length > 1;
	const shotSize = many ? {
		width: "150px",
		height: "100px"
	} : {
		width: "100%",
		maxWidth: "420px",
		height: "260px"
	};
	const shots = screens.length ? /* @__PURE__ */ jsx("div", {
		style: S.waitRow,
		children: screens.map((sc, i) => /* @__PURE__ */ jsxs("div", {
			style: {
				...S.waitShot,
				...shotSize
			},
			children: [/* @__PURE__ */ jsx("img", {
				src: sc.url,
				style: S.waitShotImg,
				alt: sc.label || ""
			}), phase === "analyzing" ? /* @__PURE__ */ jsx(Sweep, {
				index: i,
				reduceMotion
			}) : null]
		}, "w" + i))
	}) : /* @__PURE__ */ jsxs("div", {
		style: S.waitPlaceholder,
		children: [/* @__PURE__ */ jsx(Spinner, {
			size: 18,
			reduceMotion
		}), /* @__PURE__ */ jsx("span", { children: pendingKind && KIND_WAIT[pendingKind] || t("waitingScreen.getting_screens_ready") })]
	});
	const count = {
		count: screens.length,
		n: fmtNumber(screens.length)
	};
	const title = phase === "scanning" ? t("waitingScreen.title_scanning") : phase === "uploading" ? many ? t("waitingScreen.title_uploading_screens", count) : t("waitingScreen.title_uploading_one") : many ? t("waitingScreen.title_reading_flow", count) : screens.length ? t("waitingScreen.title_reading_screen") : t("waitingScreen.title_getting_pixels");
	return /* @__PURE__ */ jsx("div", {
		style: S.waitWrap,
		children: /* @__PURE__ */ jsxs("div", {
			style: S.waitCard,
			children: [
				/* @__PURE__ */ jsx("div", {
					style: S.waitHead,
					children: /* @__PURE__ */ jsx("span", {
						style: S.waitTitle,
						children: title
					})
				}),
				shots,
				/* @__PURE__ */ jsx("ul", {
					style: S.stageList,
					children: list.map((st, i) => {
						const done = i < activeIdx, now = i === activeIdx;
						return /* @__PURE__ */ jsxs("li", {
							style: {
								...S.stageItem,
								color: now ? "var(--text)" : "var(--muted)",
								opacity: now || done ? 1 : .55,
								fontWeight: now ? 600 : 400
							},
							children: [/* @__PURE__ */ jsx("span", {
								style: S.stageMark,
								children: done ? /* @__PURE__ */ jsx(Check, {
									size: 14,
									style: { color: "#3fae6b" }
								}) : /* @__PURE__ */ jsx("span", { style: now ? S.stageNow : S.stagePend })
							}), st.label]
						}, i);
					})
				}),
				/* @__PURE__ */ jsxs("button", {
					style: {
						...S.linkBtn,
						alignSelf: "flex-start"
					},
					onClick: onCancel,
					title: t("waitingScreen.stop_this_run_and_discard_it"),
					children: [/* @__PURE__ */ jsx(X, { size: 13 }), t("waitingScreen.cancel_this_run")]
				}),
				/* @__PURE__ */ jsx("div", {
					style: S.waitFoot,
					children: elapsed > 90 ? t("waitingScreen.foot_still_going") : t("waitingScreen.foot_navigate_away")
				})
			]
		})
	});
}
// src/Composer.tsx
/**
* The start button's label for a pasted link: one whole-sentence key per kind,
* so a translation can bend the noun and order the words its own way. Literal
* keys keep each one visible to the key-reference gate; an unknown kind reads
* "Critique this".
*/
function startKindLabel(kind) {
	switch (kind) {
		case "figma": return t("composer.start_kind_figma");
		case "repo": return t("composer.start_kind_repo");
		case "local": return t("composer.start_kind_local");
		case "url": return t("composer.start_kind_url");
		default: return t("composer.start_this");
	}
}
function Composer(p) {
	const ime = useImeGuard();
	const { staged, refText, dragging, blocked, showAuth, busy, err, hint, inputRef } = p;
	const canStart = !busy && (staged.length > 0 || !!refText.trim());
	const det = detectKind(refText);
	const startLabel = staged.length > 1 ? t("composer.critique_this_flow_count_screens", { count: staged.length }) : staged.length === 1 ? t("composer.critique_this_screen") : refText.trim() ? startKindLabel((det || {}).kind) : t("composer.start_plain");
	const recog = !staged.length && refText.trim() ? recognise(det) : null;
	const subLine = staged.length ? staged.length > 1 ? t("composer.staged_flow_hint", {
		count: staged.length,
		n: fmtNumber(staged.length)
	}) : t("composer.staged_one_hint") : "";
	const middle = staged.length ? /* @__PURE__ */ jsxs("div", {
		style: S.stagedRegion,
		children: [staged.map((s, i) => /* @__PURE__ */ jsxs("div", {
			style: S.stagedItem,
			children: [
				/* @__PURE__ */ jsx("div", {
					style: S.stagedThumb,
					children: /* @__PURE__ */ jsx("img", {
						src: s.url,
						style: S.stagedImg,
						alt: s.file.name
					})
				}),
				/* @__PURE__ */ jsx("span", {
					style: S.stepChip,
					children: staged.length > 1 ? t("composer.step_n", { n: fmtNumber(i + 1) }) : fmtNumber(1)
				}),
				/* @__PURE__ */ jsx("button", {
					style: S.killBtn,
					onClick: () => p.dropStaged(i),
					title: t("composer.remove"),
					"aria-label": t("composer.remove_name", { name: s.file.name }),
					children: /* @__PURE__ */ jsx(X, { size: 13 })
				}),
				/* @__PURE__ */ jsxs("div", {
					style: S.stagedFoot,
					children: [
						staged.length > 1 ? /* @__PURE__ */ jsx("button", {
							style: {
								...S.iconBtn,
								opacity: i === 0 ? .35 : 1
							},
							disabled: i === 0,
							onClick: () => p.moveStaged(i, -1),
							title: t("composer.move_earlier"),
							"aria-label": t("composer.move_earlier"),
							children: /* @__PURE__ */ jsx(ChevronLeft, { size: 13 })
						}) : null,
						staged.length > 1 ? /* @__PURE__ */ jsx("button", {
							style: {
								...S.iconBtn,
								opacity: i === staged.length - 1 ? .35 : 1
							},
							disabled: i === staged.length - 1,
							onClick: () => p.moveStaged(i, 1),
							title: t("composer.move_later"),
							"aria-label": t("composer.move_later"),
							children: /* @__PURE__ */ jsx(ChevronRight, { size: 13 })
						}) : null,
						/* @__PURE__ */ jsx("span", {
							style: S.stagedName,
							title: s.file.name,
							children: s.file.name
						})
					]
				})
			]
		}, s.id)), /* @__PURE__ */ jsxs("button", {
			style: S.addTile,
			onClick: p.pickFile,
			children: [/* @__PURE__ */ jsx(Plus, { size: 18 }), t("composer.add_screens")]
		})]
	}) : /* @__PURE__ */ jsxs("div", {
		style: {
			...S.dropTile,
			...dragging ? {
				borderColor: "var(--accent)",
				background: "color-mix(in srgb, var(--accent) 7%, transparent)"
			} : {}
		},
		onClick: p.pickFile,
		role: "button",
		tabIndex: 0,
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				p.pickFile();
			}
		},
		children: [
			/* @__PURE__ */ jsx(Upload, { size: 24 }),
			/* @__PURE__ */ jsx("div", {
				style: S.dropTitle,
				children: t("composer.drop_screenshots_or_click_to_browse")
			}),
			/* @__PURE__ */ jsx("div", {
				style: S.dropSub,
				children: t("composer.one_screen_or_several_in_order_for_a_flow_png_jp")
			})
		]
	});
	return /* @__PURE__ */ jsx("div", {
		style: S.composerMid,
		role: "presentation",
		onDragOver: p.onDragOver,
		onDragLeave: p.onDragLeave,
		onDrop: p.onDrop,
		children: /* @__PURE__ */ jsxs("div", {
			style: S.card,
			children: [
				/* @__PURE__ */ jsx("input", {
					ref: inputRef,
					type: "file",
					accept: "image/*",
					multiple: true,
					style: { display: "none" },
					onChange: p.onPick,
					tabIndex: -1,
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ jsx("h2", {
					style: S.cardTitle,
					children: blocked ? t("composer.title_blocked") : t("composer.title_ask")
				}),
				blocked ? /* @__PURE__ */ jsxs("div", {
					style: S.blockedBox,
					children: [
						/* @__PURE__ */ jsx("div", {
							style: S.blockedSay,
							children: blocked.say
						}),
						/* @__PURE__ */ jsx("div", {
							style: S.blockedHint,
							children: blocked.hint
						}),
						blocked.detail ? /* @__PURE__ */ jsx("div", {
							style: S.blockedDetail,
							children: blocked.detail
						}) : null,
						/* @__PURE__ */ jsxs("div", {
							style: {
								display: "flex",
								gap: "8px",
								marginTop: "10px",
								flexWrap: "wrap"
							},
							children: [
								blocked.fix === "local" ? /* @__PURE__ */ jsx("button", {
									style: S.linkBtn,
									onClick: () => {
										p.setBlocked(null);
										p.setRefText("/");
									},
									children: t("composer.use_a_local_folder_instead")
								}) : null,
								blocked.fix === "shots" || blocked.fix === "local" ? /* @__PURE__ */ jsxs("button", {
									style: S.linkBtn,
									onClick: () => {
										p.setBlocked(null);
										setTimeout(() => inputRef.current && inputRef.current.click(), 0);
									},
									children: [/* @__PURE__ */ jsx(Upload, { size: 13 }), t("composer.send_screenshots")]
								}) : null,
								blocked.auth ? /* @__PURE__ */ jsx("button", {
									style: S.linkBtn,
									onClick: () => p.setShowAuth((v) => !v),
									children: showAuth ? t("composer.hide_access_steps") : t("composer.fix_my_access")
								}) : null,
								blocked.fix === "retry" || blocked.auth ? /* @__PURE__ */ jsx("button", {
									style: S.linkBtn,
									onClick: () => {
										p.setBlocked(null);
										p.setShowAuth(() => false);
										p.onTryAgain();
									},
									children: t("composer.try_again")
								}) : null,
								blocked.fix === "retype" ? /* @__PURE__ */ jsx("button", {
									style: S.linkBtn,
									onClick: () => p.setBlocked(null),
									children: t("composer.fix_the_link")
								}) : null
							]
						}),
						blocked.auth && showAuth ? /* @__PURE__ */ jsxs("div", {
							style: S.authBox,
							children: [
								/* @__PURE__ */ jsx("div", {
									style: S.blockedHint,
									children: blocked.auth.lead
								}),
								/* @__PURE__ */ jsx("pre", {
									style: S.authCmds,
									children: blocked.auth.cmds.join("\n")
								}),
								/* @__PURE__ */ jsx("div", {
									style: S.blockedHint,
									children: blocked.auth.tail
								})
							]
						}) : null
					]
				}) : null,
				/* @__PURE__ */ jsxs("p", {
					style: S.cardSub,
					children: [subLine, staged.length ? /* @__PURE__ */ jsx("button", {
						style: S.clearLink,
						onClick: p.clearStaged,
						children: t("composer.clear_all")
					}) : null]
				}),
				hint ? /* @__PURE__ */ jsx("div", {
					style: {
						fontSize: "12.5px",
						color: "var(--warn)",
						textAlign: "center"
					},
					children: hint
				}) : null,
				/* @__PURE__ */ jsx(ErrorNotice, { message: err }),
				middle,
				/* @__PURE__ */ jsx("div", {
					style: S.orRow,
					role: "separator",
					"aria-hidden": "true",
					children: /* @__PURE__ */ jsx("span", { style: S.orLine })
				}),
				/* @__PURE__ */ jsx("input", {
					style: {
						...S.linkInput,
						opacity: staged.length ? .45 : 1
					},
					value: refText,
					disabled: staged.length > 0 || busy,
					"aria-label": t("composer.link_label"),
					placeholder: staged.length ? t("composer.link_placeholder_staged") : t("composer.link_placeholder"),
					onChange: (e) => p.setRefText(e.target.value),
					...ime.bindEnter({ onEnter: () => p.start() })
				}),
				/* @__PURE__ */ jsxs("button", {
					style: {
						...S.bigStart,
						...canStart ? {} : S.startOff
					},
					disabled: !canStart,
					onClick: p.start,
					title: canStart ? t("composer.start_the_critique") : t("composer.add_screenshots_or_paste_a_link_first"),
					children: [/* @__PURE__ */ jsx(PencilRuler, { size: 16 }), startLabel]
				}),
				recog ? /* @__PURE__ */ jsxs("p", {
					style: {
						...S.cardHint,
						color: recog.ok ? "var(--muted)" : "var(--error, #e5484d)"
					},
					children: [
						/* @__PURE__ */ jsx("b", {
							style: { color: recog.ok ? "var(--text)" : "inherit" },
							children: recog.ok ? kindLabel((det || {}).kind) : t("composer.unrecognised")
						}),
						recog.ok ? " · " : " — ",
						recog.text
					]
				}) : null,
				/* @__PURE__ */ jsx("p", {
					style: S.cardHint,
					children: recog ? null : t("composer.render_before_judging")
				})
			]
		})
	});
}
// src/ScopingPicker.tsx
var sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
function ScopingPicker(p) {
	const ime = useImeGuard();
	const { scope, picked, refBrief, dragId } = p;
	const groups = /* @__PURE__ */ new Map();
	scope.screens.forEach((s) => {
		const g = s.group || t("scopingPicker.group_fallback");
		if (!groups.has(g)) groups.set(g, []);
		groups.get(g).push(s);
	});
	const seeable = scope.screens.filter((s) => s.canSee !== false).length;
	return /* @__PURE__ */ jsx("div", {
		style: S.scopeWrap,
		children: /* @__PURE__ */ jsxs("div", {
			style: S.scopeCard,
			children: [
				/* @__PURE__ */ jsx("h2", {
					style: S.cardTitle,
					children: t("scopingPicker.what_should_i_audit")
				}),
				/* @__PURE__ */ jsxs("p", {
					style: S.cardSub,
					children: [
						scope.framework ? /* @__PURE__ */ jsx("b", { children: scope.framework }) : null,
						scope.framework ? " · " : "",
						t("scopingPicker.screens_found_count", {
							count: scope.screens.length,
							n: fmtNumber(scope.screens.length),
							m: fmtNumber(seeable)
						})
					]
				}),
				scope.note ? /* @__PURE__ */ jsx("p", {
					style: S.scopeNote,
					children: scope.note
				}) : null,
				scope.flows.length ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
					style: S.sectionH,
					children: t("scopingPicker.suggested_flows")
				}), /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						flexDirection: "column",
						gap: "8px"
					},
					children: scope.flows.map((f, i) => {
						const on = sameSet(picked, f.screenIds || []);
						return /* @__PURE__ */ jsxs("button", {
							style: {
								...S.flowCard,
								...on ? S.flowCardOn : {}
							},
							onClick: () => p.useFlow(f),
							children: [/* @__PURE__ */ jsxs("div", {
								style: {
									flex: 1,
									minWidth: 0
								},
								children: [
									/* @__PURE__ */ jsx("div", {
										style: S.flowName,
										children: f.label || t("scopingPicker.flow_n", { n: fmtNumber(i + 1) })
									}),
									/* @__PURE__ */ jsx("div", {
										style: S.flowSteps,
										children: (f.screenIds || []).map((id, n) => {
											const sc = scope.screens.find((s) => s.id === id);
											return (n ? " → " : "") + (sc ? shortLabel(sc.label) : id);
										}).join("")
									}),
									f.why ? /* @__PURE__ */ jsx("div", {
										style: S.flowWhy,
										children: f.why
									}) : null
								]
							}), /* @__PURE__ */ jsx("span", {
								style: {
									...S.guessTag,
									...f.basis === "observed" ? {
										color: "var(--accent)",
										borderColor: "var(--accent)"
									} : {}
								},
								children: f.basis === "observed" ? t("scopingPicker.tag_from_links") : t("scopingPicker.tag_guess")
							})]
						}, i);
					})
				})] }) : null,
				/* @__PURE__ */ jsxs("div", { children: [
					/* @__PURE__ */ jsxs("div", {
						style: S.sectionH,
						children: [t("scopingPicker.screens"), /* @__PURE__ */ jsx("span", {
							style: {
								fontWeight: 600,
								textTransform: "none"
							},
							children: "· " + t("scopingPicker.picked_count", {
								count: picked.length,
								n: fmtNumber(picked.length)
							})
						})]
					}),
					/* @__PURE__ */ jsx("p", {
						style: {
							...S.pickWhy,
							margin: "0 0 7px 2px"
						},
						children: picked.length > 1 ? t("scopingPicker.hint_order") : t("scopingPicker.hint_pick")
					}),
					/* @__PURE__ */ jsx("div", {
						style: S.scopeScrollFlex,
						children: Array.from(groups.entries()).flatMap(([g, list]) => [/* @__PURE__ */ jsx("div", {
							style: S.groupH,
							children: g
						}, "g" + g), ...list.map((s) => {
							const off = s.canSee === false;
							const ord = picked.indexOf(s.id);
							const isDragging = dragId === s.id;
							const canDrag = ord >= 0 && picked.length > 1;
							return /* @__PURE__ */ jsxs("div", {
								style: {
									...S.pickRow,
									...off ? S.pickRowOff : {},
									...isDragging ? S.pickRowDrag : {}
								},
								role: off ? void 0 : "checkbox",
								"aria-checked": off ? void 0 : ord >= 0,
								"aria-disabled": off || void 0,
								tabIndex: off ? -1 : 0,
								onClick: off ? void 0 : () => p.togglePick(s.id),
								onKeyDown: off ? void 0 : (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										p.togglePick(s.id);
									}
								},
								title: off ? s.why || t("scopingPicker.cant_render_title") : s.ref || s.id,
								draggable: canDrag,
								onDragStart: canDrag ? (e) => {
									p.setDragId(s.id);
									e.dataTransfer.effectAllowed = "move";
								} : void 0,
								onDragEnd: () => p.setDragId(null),
								onDragOver: ord >= 0 && dragId && dragId !== s.id ? (e) => {
									e.preventDefault();
									p.dropPickAt(dragId, s.id);
								} : void 0,
								onDrop: (e) => {
									e.preventDefault();
									p.setDragId(null);
								},
								children: [
									canDrag ? /* @__PURE__ */ jsx("span", {
										style: S.grip,
										title: t("scopingPicker.drag_to_reorder"),
										children: /* @__PURE__ */ jsx(GripVertical, { size: 14 })
									}) : null,
									ord >= 0 ? /* @__PURE__ */ jsx("span", {
										style: S.pickOrd,
										children: String(ord + 1)
									}) : /* @__PURE__ */ jsx("span", { style: S.pickBox }),
									/* @__PURE__ */ jsx("span", {
										style: {
											flex: 1,
											minWidth: 0,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap"
										},
										children: shortLabel(s.label)
									}),
									ord >= 0 && picked.length > 1 ? /* @__PURE__ */ jsxs("span", {
										style: {
											display: "inline-flex",
											gap: "4px"
										},
										children: [/* @__PURE__ */ jsx("button", {
											style: {
												...S.iconBtn,
												opacity: ord === 0 ? .3 : 1
											},
											disabled: ord === 0,
											onClick: (e) => {
												e.stopPropagation();
												p.movePick(s.id, -1);
											},
											title: t("scopingPicker.move_earlier"),
											"aria-label": t("scopingPicker.move_earlier"),
											children: /* @__PURE__ */ jsx(ChevronLeft, { size: 12 })
										}), /* @__PURE__ */ jsx("button", {
											style: {
												...S.iconBtn,
												opacity: ord === picked.length - 1 ? .3 : 1
											},
											disabled: ord === picked.length - 1,
											onClick: (e) => {
												e.stopPropagation();
												p.movePick(s.id, 1);
											},
											title: t("scopingPicker.move_later"),
											"aria-label": t("scopingPicker.move_later"),
											children: /* @__PURE__ */ jsx(ChevronRight, { size: 12 })
										})]
									}) : null,
									/* @__PURE__ */ jsx("span", {
										style: S.pickWhy,
										children: off ? s.why || t("scopingPicker.cant_render_short") : s.ref || ""
									})
								]
							}, s.id);
						})])
					})
				] }),
				/* @__PURE__ */ jsxs("div", {
					style: S.scopeFoot,
					children: [
						/* @__PURE__ */ jsx("input", {
							style: S.linkInput,
							value: refBrief,
							"aria-label": t("scopingPicker.optional_brief_who_is_it_for_and_what_is_the_mai"),
							placeholder: t("scopingPicker.optional_who_is_it_for_and_what_s_the_main_task"),
							onChange: (e) => p.setRefBrief(e.target.value),
							...ime.bindEnter({ onEnter: () => {
								if (picked.length) p.runScoped();
							} })
						}),
						/* @__PURE__ */ jsxs("button", {
							style: {
								...S.bigStart,
								...picked.length ? {} : S.startOff
							},
							disabled: !picked.length,
							onClick: p.runScoped,
							children: [/* @__PURE__ */ jsx(PencilRuler, { size: 16 }), picked.length > 1 ? t("scopingPicker.critique_this_flow_count_screens", { count: picked.length }) : picked.length === 1 ? t("scopingPicker.critique_this_screen") : t("scopingPicker.pick_at_least_one_screen")]
						}),
						/* @__PURE__ */ jsx("button", {
							style: {
								...S.linkBtn,
								alignSelf: "center"
							},
							onClick: p.onStartOver,
							children: t("scopingPicker.start_over")
						})
					]
				})
			]
		})
	});
}
// src/AskLayer.tsx
function AskLayer(p) {
	const ime = useImeGuard();
	const { sel, asks, openAskId, askDraft, reduceMotion } = p;
	const askChip = sel ? /* @__PURE__ */ jsxs("button", {
		style: {
			...S.askChip,
			top: sel.top + "px",
			left: sel.left + "px"
		},
		onMouseDown: (e) => e.preventDefault(),
		onClick: () => {
			p.setOpenAskId("new");
			p.setAskDraft("");
		},
		children: [/* @__PURE__ */ jsx(Sparkle, { size: 13 }), t("askLayer.ask_about_this")]
	}) : null;
	const activeAsk = openAskId && openAskId !== "new" ? asks.find((a) => a.id === openAskId) : null;
	const composing = openAskId === "new" && sel;
	const anchorTop = composing ? sel.top : 140;
	const anchorLeft = composing ? sel.left : 470;
	const askPop = activeAsk || composing ? /* @__PURE__ */ jsxs("div", {
		style: {
			...S.askPop,
			top: Math.max(12, Math.min(anchorTop + 26, window.innerHeight - 300)) + "px",
			left: Math.max(16, Math.min(anchorLeft - 180, window.innerWidth - 376)) + "px"
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: S.askHead,
				children: [
					/* @__PURE__ */ jsx("div", {
						style: S.askQuote,
						children: "“" + (composing ? sel.quote : activeAsk.quote) + "”"
					}),
					activeAsk ? /* @__PURE__ */ jsx("button", {
						style: S.askIcon,
						title: t("askLayer.remove_this_annotation"),
						"aria-label": t("askLayer.remove_this_annotation"),
						onClick: () => p.removeAsk(activeAsk.id),
						children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
					}) : null,
					/* @__PURE__ */ jsx("button", {
						style: S.askIcon,
						title: t("askLayer.close"),
						"aria-label": t("askLayer.close"),
						onClick: () => {
							p.setOpenAskId(null);
							p.setSel(null);
						},
						children: /* @__PURE__ */ jsx(X, { size: 15 })
					})
				]
			}),
			activeAsk && activeAsk.turns.length ? /* @__PURE__ */ jsx("div", {
				ref: p.threadRef,
				style: S.askThread,
				children: activeAsk.turns.map((t$2, i) => /* @__PURE__ */ jsxs("div", {
					style: { marginBottom: i === activeAsk.turns.length - 1 ? 0 : "12px" },
					children: [t$2.q ? /* @__PURE__ */ jsx("div", {
						style: S.askQ,
						children: t$2.q
					}) : null, t$2.pending ? /* @__PURE__ */ jsxs("div", {
						style: {
							...S.askAnswer,
							color: "var(--muted)",
							display: "flex",
							gap: "7px",
							alignItems: "center"
						},
						children: [/* @__PURE__ */ jsx(Spinner, {
							size: 13,
							reduceMotion
						}), t("askLayer.thinking")]
					}) : t$2.failed ? /* @__PURE__ */ jsx("div", {
						style: {
							...S.askAnswer,
							marginTop: t$2.q ? "4px" : 0
						},
						children: /* @__PURE__ */ jsx(ErrorNotice, {
							variant: "inline",
							title: t("askLayer.answer_failed_ask_again_below"),
							messagePlacement: "below",
							message: t$2.a
						})
					}) : /* @__PURE__ */ jsx("div", {
						style: {
							...S.askAnswer,
							marginTop: t$2.q ? "4px" : 0,
							color: "var(--text)"
						},
						children: t$2.a
					})]
				}, i))
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				style: S.askRow,
				children: [/* @__PURE__ */ jsx("input", {
					style: {
						...S.askInput,
						...p.pending ? { opacity: .6 } : {}
					},
					value: askDraft,
					autoFocus: true,
					disabled: p.pending,
					"aria-label": t("askLayer.question_label"),
					placeholder: !activeAsk || !activeAsk.turns.length ? t("askLayer.what_dont_you_understand_about_this") : activeAsk.turns[activeAsk.turns.length - 1].failed ? t("askLayer.ask_again") : t("askLayer.ask_a_follow_up"),
					onChange: (e) => p.setAskDraft(e.target.value),
					...ime.bindEnter({
						onEnter: () => {
							if (p.pending) return;
							if (composing) p.askAbout(sel.quote, askDraft);
							else p.askFollowUp(activeAsk.id, askDraft);
						},
						onEscape: () => {
							p.setOpenAskId(null);
							p.setSel(null);
						}
					})
				}), /* @__PURE__ */ jsx("button", {
					style: {
						...S.askIcon,
						...S.askSend,
						...p.pending ? {
							opacity: .6,
							cursor: "default"
						} : {}
					},
					title: t("askLayer.ask"),
					"aria-label": t("askLayer.ask"),
					disabled: p.pending,
					onClick: () => {
						if (p.pending) return;
						if (composing) p.askAbout(sel.quote, askDraft);
						else p.askFollowUp(activeAsk.id, askDraft);
					},
					children: /* @__PURE__ */ jsx(CornerDownLeft, { size: 15 })
				})]
			})
		]
	}) : null;
	return /* @__PURE__ */ jsxs(Fragment, { children: [askChip, askPop] });
}
// src/focusTrap.ts
/**
* Modal keyboard behaviour for the zoom lightbox: focus moves in on open and
* back out on close, Escape dismisses, and Tab / Shift+Tab cycle WITHIN the
* dialog. A restatement of the dashboard's `hooks/useDialogFocusTrap.ts` for a
* bundle, which cannot import it.
*
* What the dashboard's hook adds and this one does not: standing down while a
* remote Crew is in front, and its WebKit IME latch for the key that commits a
* candidate after `compositionend`. Here a key the IME is still composing
* (`isComposing`) is left alone, which covers the common case.
*/
var FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])";
/** `handleEscape: false` leaves Escape to a caller that owns dismissal itself. */
function useDialogFocusTrap(containerRef, onEscape, { handleEscape = true } = {}) {
	useEffect(() => {
		const restoreTo = document.activeElement;
		(containerRef.current?.querySelector("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])") ?? containerRef.current)?.focus({ preventScroll: true });
		return () => restoreTo?.focus?.({ preventScroll: true });
	}, [containerRef]);
	useLayoutEffect(() => {
		const onKey = (e) => {
			if (e.isComposing) return;
			if (e.key === "Escape" && handleEscape) {
				onEscape();
				return;
			}
			const container = containerRef.current;
			if (e.key !== "Tab" || !container) return;
			const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
			if (!items.length) return;
			const firstEl = items[0];
			const lastEl = items[items.length - 1];
			const active = document.activeElement;
			const wrapsForward = !e.shiftKey && active === lastEl;
			const wrapsBackward = e.shiftKey && (active === firstEl || active === container);
			const refocuses = !wrapsForward && !wrapsBackward && !container.contains(active);
			if (!wrapsForward && !wrapsBackward && !refocuses) return;
			e.preventDefault();
			(wrapsBackward ? lastEl : firstEl).focus();
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, [
		containerRef,
		onEscape,
		handleEscape
	]);
}
// src/ZoomLightbox.tsx
/**
* ZoomLightbox — the full-size view of a critiqued screen.
*
* It is an aria-modal dialog, so it takes keyboard focus when it opens, keeps
* Tab inside, and gives focus back to the Enlarge control when it closes. The
* Close button sits INSIDE the dialog node: a trap that held focus in a dialog
* without its own Close would leave keyboard users nowhere to go but Escape.
*
* Escape stays on the page's own window listener (DesignCritiquePage), so the
* trap is wired with Escape off and a stable no-op in its place.
*/
var NO_ESCAPE = () => {};
function ZoomLightbox({ src, onClose, children }) {
	const dialogRef = useRef(null);
	useDialogFocusTrap(dialogRef, NO_ESCAPE, { handleEscape: false });
	return /* @__PURE__ */ jsx("div", {
		style: S.lbOverlay,
		role: "presentation",
		onClick: (e) => {
			if (e.target === e.currentTarget) onClose();
		},
		children: /* @__PURE__ */ jsxs("div", {
			ref: dialogRef,
			style: S.lbInner,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": t("designCritiquePage.full_size_view"),
			children: [
				/* @__PURE__ */ jsx("img", {
					src,
					style: S.lbImg,
					alt: t("designCritiquePage.full_size")
				}),
				children,
				/* @__PURE__ */ jsx("div", {
					style: S.lbCloseWrap,
					children: /* @__PURE__ */ jsx("button", {
						style: S.lbClose,
						onClick: onClose,
						title: t("designCritiquePage.close_esc"),
						"aria-label": t("askLayer.close"),
						children: /* @__PURE__ */ jsx(X, { size: 18 })
					})
				})
			]
		})
	});
}
// src/DesignCritiquePage.tsx
/** The rail's "rendering it" line for a pasted link, one whole-sentence key per kind. */
function railPendingLabel(kind) {
	switch (kind) {
		case "figma": return t("designCritiquePage.rail_pending_figma");
		case "repo": return t("designCritiquePage.rail_pending_repo");
		case "local": return t("designCritiquePage.rail_pending_local");
		case "url": return t("designCritiquePage.rail_pending_url");
		default: return t("designCritiquePage.rail_pending_design");
	}
}
var CANCELLED = () => Object.assign(/* @__PURE__ */ new Error("cancelled"), { cancelled: true });
var TIMEOUT = () => Object.assign(/* @__PURE__ */ new Error("still running"), { timeout: true });
function DesignCritiquePage() {
	const [phase, setPhase] = useState("new");
	const [scope, setScope] = useState(null);
	const [picked, setPicked] = useState([]);
	const [refBrief, setRefBrief] = useState("");
	const [slot, setSlot] = useState("");
	const [refHandle, setRefHandle] = useState("");
	const [refTarget, setRefTarget] = useState(null);
	const methodRef = useRef("");
	const [justFinished, setJustFinished] = useState(null);
	const [backgroundFailures, setBackgroundFailures] = useState([]);
	const [dragId, setDragId] = useState(null);
	const [sel, setSel] = useState(null);
	const [asks, setAsks] = useState([]);
	const [openAskId, setOpenAskId] = useState(null);
	const [askDraft, setAskDraft] = useState("");
	const [blocked, setBlocked] = useState(null);
	const [showAuth, setShowAuth] = useState(false);
	const [current, setCurrent] = useState(null);
	const [critiques, setCritiques] = useState(loadHistory);
	const [err, setErrRaw] = useState("");
	const [hint, setHintRaw] = useState("");
	const setErr = (m) => {
		setErrRaw(m);
		if (m) setHintRaw("");
	};
	const setHint = (m) => {
		setHintRaw(m);
		if (m) setErrRaw("");
	};
	const [dragging, setDragging] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [zoom, setZoom] = useState(false);
	const [active, setActive] = useState(null);
	const [open, setOpen] = useState(() => /* @__PURE__ */ new Set([0]));
	const [screenIdx, setScreenIdx] = useState(0);
	const [refText, setRefText] = useState("");
	const [staged, setStaged] = useState([]);
	const [elapsed, setElapsed] = useState(0);
	const [writing, setWriting] = useState(false);
	const [pendingKind, setPendingKind] = useState(null);
	const reduceMotion = useReduceMotion();
	const { toasts } = useToasts();
	const inputRef = useRef(null);
	const rootRef = useRef(null);
	const historyBtnRef = useRef(null);
	const historyMenuRef = useRef(null);
	const rowRefs = useRef({});
	const startedAtRef = useRef(0);
	const aliveRef = useRef(true);
	const phaseRef = useRef("new");
	const activeSlotRef = useRef("");
	/**
	* Slots whose run the user cancelled. Keyed per slot because more than one
	* critique can be in flight: a single boolean would trip for every poller, so
	* cancelling one run would exit the others and discard their results.
	*/
	const cancelledRef = useRef(/* @__PURE__ */ new Set());
	/**
	* Bumped whenever the user starts or resets a run, so an async step that began
	* earlier can tell it no longer owns the screen. An upload has no slot yet —
	* the slot is created after it completes — so `activeSlotRef` cannot identify
	* it and `isWatching()` has nothing to compare; this counter is what protects
	* the pre-slot window.
	*/
	const runSeqRef = useRef(0);
	/** Slots that already have a live poller, so a run is never polled twice. */
	const pollingRef = useRef(/* @__PURE__ */ new Set());
	const isCancelled = (slotKey) => cancelledRef.current.has(slotKey);
	const askSlotRef = useRef("");
	/**
	* Follow-ups deliberately share ONE chat slot so the thread keeps its context.
	* That makes them strictly sequential: `/api/chat` queues a second turn on the
	* same slot and `pollForText` only ever reads the latest assistant message, so
	* two turns in flight both resolve to the second answer and the first question
	* is recorded with a reply that does not belong to it.
	*/
	const [askPending, setAskPending] = useState(false);
	const threadRef = useRef(null);
	/** The open thread, read when a turn fails after an await. The composer
	*  draft is shared by every thread, so a failed question goes back into it
	*  only while its own thread is still the one on screen. */
	const openAskIdRef = useRef(openAskId);
	openAskIdRef.current = openAskId;
	const narrow = useNarrow(rootRef);
	useEffect(() => {
		aliveRef.current = true;
		return () => {
			aliveRef.current = false;
		};
	}, []);
	useEffect(() => {
		phaseRef.current = phase;
	}, [phase]);
	useEffect(() => {
		if (phase !== "uploading" && phase !== "analyzing" && phase !== "scanning") return;
		const tick = () => {
			const t0 = startedAtRef.current;
			setElapsed(t0 ? Math.max(0, Math.floor((Date.now() - t0) / 1e3)) : 0);
		};
		tick();
		const id = setInterval(tick, 500);
		return () => clearInterval(id);
	}, [phase]);
	useEffect(() => {
		if (!zoom) return;
		const k = (e) => {
			if (e.key === "Escape") setZoom(false);
		};
		window.addEventListener("keydown", k);
		return () => window.removeEventListener("keydown", k);
	}, [zoom]);
	useMenuKeyboard({
		enabled: menuOpen,
		containerRef: historyMenuRef
	});
	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			setMenuOpen(false);
			historyBtnRef.current?.focus();
		};
		const onDown = (e) => {
			const t = e.target;
			if (historyMenuRef.current?.contains(t) || historyBtnRef.current?.contains(t)) return;
			setMenuOpen(false);
		};
		window.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onDown);
		return () => {
			window.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onDown);
		};
	}, [menuOpen]);
	const pickFromHistory = (e) => {
		selectCritique(e);
		historyBtnRef.current?.focus();
	};
	const pollForReport = async (slotKey) => {
		const began = Date.now();
		let misses = 0;
		while (Date.now() - began < HARD_CAP_MS) {
			await new Promise((r) => setTimeout(r, 1500));
			if (!aliveRef.current || isCancelled(slotKey)) throw CANCELLED();
			let d;
			try {
				d = await designCritiqueApi.getSlot(slotKey);
			} catch {
				if (++misses >= 8) throw new Error("That run is no longer available — start a new critique.");
				continue;
			}
			misses = 0;
			if (!aliveRef.current || isCancelled(slotKey)) throw CANCELLED();
			const c = lastAssistant(d && d.messages);
			if (c && c.trim() && activeSlotRef.current === slotKey) setWriting(true);
			if (d && !d.running && c) {
				const p = jsonFromMessages(d.messages, looksLikeReport);
				if (p) return p;
				throw new Error("The critic replied but not in a readable format.");
			}
		}
		throw TIMEOUT();
	};
	/** How many rows the slot holds right now -- the baseline a follow-up's poll
	*  measures new rows against. Read BEFORE the send goes out. */
	const slotLength = async (slotKey) => {
		const d = await designCritiqueApi.getSlot(slotKey);
		return Array.isArray(d && d.messages) ? d.messages.length : 0;
	};
	const pollForText = async (slotKey, seen) => {
		const began = Date.now();
		let misses = 0;
		while (Date.now() - began < 18e4) {
			await new Promise((r) => setTimeout(r, 1200));
			if (!aliveRef.current) throw CANCELLED();
			let d;
			try {
				d = await designCritiqueApi.getSlot(slotKey);
			} catch {
				if (++misses >= 8) throw new Error("lost contact");
				continue;
			}
			misses = 0;
			const c = lastAssistant(((d && Array.isArray(d.messages) ? d.messages : []) ?? []).slice(seen));
			if (d && !d.running && c && c.trim()) return c.trim();
		}
		throw TIMEOUT();
	};
	const startClock = (fromMs) => {
		startedAtRef.current = fromMs || Date.now();
		setElapsed(0);
	};
	const openSlot = async () => {
		const s = await designCritiqueApi.openSlot();
		trackSlot(s.key);
		markLive(s.key);
		return s.key;
	};
	const send = (slotKey, message) => designCritiqueApi.send(slotKey, message);
	const dropSlot = (slotKey) => {
		if (!slotKey) return;
		untrackSlot(slotKey);
		unmarkLive(slotKey);
		designCritiqueApi.deleteSlot(slotKey);
	};
	const loadMethod = async () => {
		if (methodRef.current) return methodRef.current;
		try {
			const m = await designCritiqueApi.method();
			methodRef.current = m && m.checklist || "";
		} catch {
			methodRef.current = "";
		}
		return methodRef.current;
	};
	const showReport = (raw, screens, entry) => {
		const report = normalizeReport(raw) || raw;
		setCurrent({
			report,
			screens: screens || [],
			entryId: entry ? entry.id : null
		});
		const saved = (entry && Array.isArray(entry.asks) ? entry.asks : []).map((a) => a.turns ? a : {
			id: a.id,
			quote: a.quote,
			turns: [{
				t: 0,
				q: a.q || "",
				a: a.a || "",
				pending: false,
				failed: !!a.failed
			}]
		});
		setAsks(saved);
		setOpenAskId(null);
		setSel(null);
		setAskDraft("");
		if (askSlotRef.current) {
			dropSlot(askSlotRef.current);
			askSlotRef.current = "";
		}
		setOpen(/* @__PURE__ */ new Set([0]));
		setActive(null);
		setZoom(false);
		setScreenIdx(0);
		setPhase("report");
	};
	/**
	* Clear the persisted job ONLY if it is this run's.
	*
	* One job record is persisted at a time, so an older run reaching its end must
	* not wipe a newer one's. Records are keyed by slot, so this removes exactly
	* this run's entry and leaves any other in-flight run resumable.
	*/
	/**
	* End one run completely: forget its resume pointer, release its server slot,
	* and remove any pending row. Releasing the slot WITHOUT forgetting the job
	* leaves a reload able to resume a run whose slot no longer exists, which then
	* dies on an availability error. Every terminal path goes through here so the
	* two cannot drift apart.
	*/
	const endRun = (slotKey) => {
		if (!slotKey) return;
		clearJob(slotKey);
		dropSlot(slotKey);
		setCritiques(dropPendingCritique(slotKey));
	};
	/**
	* Is the user currently watching this run? Both the run slot AND a waiting
	* phase must match: more than one critique can be in flight, so a run that
	* has been backgrounded by `+ New` must never write to the foreground.
	*/
	const isWatching = (slotKey) => activeSlotRef.current === slotKey && (phaseRef.current === "analyzing" || phaseRef.current === "uploading" || phaseRef.current === "scanning");
	const finishReport = (slotKey, uploaded, raw) => {
		const rep = normalizeReport(raw) || raw;
		const screens = resolveScreens(rep, uploaded);
		const cur = loadHistory();
		let next = cur;
		const at = cur.findIndex((e) => e.slotKey === slotKey);
		const thumbUrl = screens[0] ? screens[0].url : "";
		const read = rep.overallRead || "";
		if (at < 0) {
			next = [{
				id: Date.now(),
				ts: Date.now(),
				slotKey,
				screens,
				thumbUrl,
				read,
				report: rep
			}, ...cur];
			saveHistory(next);
		} else if (cur[at].pending) {
			next = cur.slice();
			next[at] = {
				...cur[at],
				screens,
				thumbUrl,
				read,
				report: rep,
				pending: false
			};
			saveHistory(next);
		}
		endRun(slotKey);
		setCritiques(next);
		if (isWatching(slotKey)) showReport(rep, screens, next.find((e) => e.slotKey === slotKey) || next[0]);
		else setJustFinished({
			slotKey,
			read: rep.overallRead || t("designCritiquePage.critique_ready_fallback"),
			screens,
			report: rep
		});
	};
	const failWith = (e, slotKey) => {
		const flag = e;
		if (flag && flag.cancelled) return;
		const watching = isWatching(slotKey);
		if (flag && flag.timeout) {
			if (watching) {
				setHint(t("designCritiquePage.still_working_on_this_one_it_s_kept_running_come"));
				setPhase("error");
			}
			return;
		}
		endRun(slotKey);
		setCritiques(dropPendingCritique(slotKey));
		const message = e instanceof Error ? e.message : t("designCritiquePage.something_went_wrong");
		if (watching) {
			setErr(message);
			setPhase("error");
		} else setBackgroundFailures((prev) => [...prev.filter((f) => f.slotKey !== slotKey), {
			slotKey,
			message
		}]);
	};
	const ask = async (prompt, uploaded, foreground = true) => {
		let slotKey = "";
		try {
			slotKey = await openSlot();
			if (foreground) activeSlotRef.current = slotKey;
			else setCritiques(beginPendingCritique(slotKey, uploaded || []));
			saveJob({
				stage: "analyzing",
				slotKey,
				screens: uploaded || [],
				ts: Date.now()
			});
			await send(slotKey, prompt);
			const rep = await pollForReport(slotKey);
			finishReport(slotKey, uploaded, rep);
		} catch (e) {
			failWith(e, slotKey);
		}
	};
	const runImages = async (fileList) => {
		const files = Array.from(fileList || []).filter((f) => /^image\//.test(f.type || ""));
		if (!files.length) {
			setHint(t("designCritiquePage.those_weren_t_image_files"));
			setPhase("error");
			return;
		}
		if (files.length > 20) {
			setHint(t("designCritiquePage.that_s_more_than_20_screens_send_fewer"));
			setPhase("error");
			return;
		}
		const seq = ++runSeqRef.current;
		setErr("");
		setHint("");
		setBlocked(null);
		setShowAuth(false);
		setMenuOpen(false);
		startClock();
		setWriting(false);
		setPendingKind(null);
		setPhase("uploading");
		try {
			const { paths } = await designCritiqueApi.uploadFiles(files);
			if (!paths || !paths.length) throw new Error("no file paths returned");
			const uploaded = paths.map((p, i) => ({
				step: i + 1,
				label: "Screen " + (i + 1),
				url: fileUrl(p)
			}));
			const method = await loadMethod();
			const mine = runSeqRef.current === seq;
			if (mine) {
				setCurrent({
					report: null,
					screens: uploaded
				});
				setScreenIdx(0);
				setPhase("analyzing");
			}
			await ask(IMAGES_PROMPT(paths, void 0, method), uploaded, mine);
		} catch (e) {
			if (runSeqRef.current === seq) {
				setErr(e instanceof Error ? e.message : t("designCritiquePage.something_went_wrong"));
				setPhase("error");
			}
		}
	};
	const applyDiscovery = (info, det, jobKey) => {
		if (info.blocked && info.blocked.reason) {
			const d = info.blocked.detail;
			setBlocked({
				...BLOCKED[info.blocked.reason] || BLOCKED.other,
				detail: typeof d === "string" ? d : ""
			});
			clearJob(jobKey);
			setPhase("error");
			return;
		}
		const list = Array.isArray(info.screens) ? info.screens.filter((s) => s && s.id) : [];
		if (!list.length) {
			clearJob(jobKey);
			setErr(discoveryNote(info) || t("designCritiquePage.i_got_in_but_there_s_nothing_in_there_i_can"));
			setPhase("error");
			return;
		}
		const norm = normalizeScope({
			...info,
			screens: list
		}) || {
			...info,
			screens: list,
			flows: []
		};
		setScope(norm);
		const first = norm.flows[0];
		const preset = first && first.screenIds && first.screenIds.length ? first.screenIds.filter((id) => list.some((s) => s.id === id)) : list.filter((s) => s.canSee !== false).map((s) => s.id);
		setPicked(preset);
		setSlot(jobKey);
		setRefHandle(info.handle || "");
		saveJob({
			stage: "scoping",
			slotKey: jobKey,
			kind: det.kind,
			value: det.value,
			ts: Date.now(),
			scope: norm,
			picked: preset,
			handle: info.handle
		});
		setPhase("scoping");
	};
	const runRef = async (raw) => {
		const det = detectKind(raw);
		if (!det) return;
		if (det.kind === "unknown") {
			setHint(t("designCritiquePage.couldn_t_tell_what_that_is_give_me_a_figma_link"));
			setPhase("error");
			return;
		}
		const seq = ++runSeqRef.current;
		const jobKey = "ref-" + Date.now();
		setErr("");
		setHint("");
		setBlocked(null);
		setShowAuth(false);
		setMenuOpen(false);
		startClock();
		setWriting(false);
		setPendingKind(det.kind);
		setCurrent({
			report: null,
			screens: []
		});
		setScreenIdx(0);
		setScope(null);
		setPicked([]);
		setRefHandle("");
		setRefTarget({
			kind: det.kind,
			value: det.value
		});
		setSlot(jobKey);
		activeSlotRef.current = "";
		setPhase("scanning");
		try {
			const info = await designCritiqueApi.discover(det.kind, det.value, (jobId) => {
				saveJob({
					stage: "scanning",
					slotKey: jobKey,
					kind: det.kind,
					value: det.value,
					ts: Date.now(),
					discoverJob: jobId
				});
			});
			if (runSeqRef.current !== seq) return;
			applyDiscovery(info, det, jobKey);
		} catch (e) {
			if (runSeqRef.current !== seq) return;
			const flag = e;
			if (flag && flag.cancelled) return;
			clearJob(jobKey);
			setErr(e instanceof Error ? e.message : t("designCritiquePage.that_scan_didn_t_finish"));
			setPhase("error");
		}
	};
	const critiqueRendered = async (out, jobKey, seq, brief) => {
		const rendered = Array.isArray(out.screens) ? out.screens.filter((s) => s && s.path) : [];
		if (!rendered.length) {
			if (jobKey) {
				clearJob(jobKey);
				dropSlot(jobKey);
			}
			setErr(t("designCritiquePage.that_critique_didn_t_finish"));
			setPhase("error");
			return;
		}
		if (jobKey) {
			clearJob(jobKey);
			dropSlot(jobKey);
		}
		setSlot("");
		const paths = rendered.map((s) => s.path);
		const uploaded = rendered.map((s, i) => ({
			step: i + 1,
			label: s.label,
			url: fileUrl(s.path)
		}));
		const missed = Array.isArray(out.couldNotSee) ? out.couldNotSee : [];
		const method = await loadMethod();
		const mine = seq === void 0 || runSeqRef.current === seq;
		if (mine) {
			setCurrent({
				report: null,
				screens: uploaded
			});
			setScreenIdx(0);
		}
		await ask(IMAGES_PROMPT(paths, brief, method, missed), uploaded, mine);
	};
	const runScoped = async () => {
		if (!scope || !picked.length || !refTarget) return;
		const byId = new Map(scope.screens.map((s) => [s.id, s]));
		const picks = picked.map((id) => byId.get(id)).filter(Boolean);
		const jobKey = slot;
		const seq = ++runSeqRef.current;
		const brief = refBrief;
		startClock();
		setWriting(false);
		setPhase("analyzing");
		try {
			const out = await designCritiqueApi.render({
				kind: refTarget.kind,
				value: refTarget.value,
				handle: refHandle,
				picks: picks.map((p) => ({
					id: p.id,
					label: p.label,
					ref: p.ref
				}))
			}, (jobId) => {
				saveJob({
					stage: "rendering",
					slotKey: jobKey,
					kind: refTarget.kind,
					value: refTarget.value,
					ts: Date.now(),
					renderJob: jobId,
					scope,
					picked,
					refBrief: brief,
					handle: refHandle
				});
			});
			if (runSeqRef.current !== seq) return;
			await critiqueRendered(out, jobKey, seq, brief);
		} catch (e) {
			if (runSeqRef.current !== seq) return;
			const flag = e;
			if (flag && flag.cancelled) return;
			if (jobKey) clearJob(jobKey);
			setErr(e instanceof Error ? e.message : t("designCritiquePage.something_went_wrong"));
			setPhase("error");
		}
	};
	useEffect(() => {
		const keep = new Set(loadLive());
		for (const j of loadJobs()) if (j.slotKey) keep.add(j.slotKey);
		const strays = loadSlots().filter((k) => k && !keep.has(k));
		if (!strays.length) return;
		saveSlots([...keep]);
		for (const k of strays) designCritiqueApi.deleteSlot(k);
	}, []);
	useEffect(() => {
		const all = loadJobs();
		const job = all[0];
		for (const other of all.slice(1)) if (other.stage === "analyzing") resumeAnalyzing(other);
		if (!job || !job.slotKey) return;
		if (job.stage === "analyzing") pollingRef.current.add(job.slotKey);
		if (job.stage === "scoping" && job.scope) {
			setSlot(job.slotKey);
			setScope(normalizeScope(job.scope) || job.scope);
			setPicked(Array.isArray(job.picked) ? job.picked : []);
			setRefBrief(job.refBrief || "");
			setPendingKind(job.kind || null);
			setRefHandle(job.handle || "");
			if (job.kind && job.value) setRefTarget({
				kind: job.kind,
				value: job.value
			});
			setCurrent({
				report: null,
				screens: []
			});
			setPhase("scoping");
			return;
		}
		if (job.stage === "scanning") {
			if (job.discoverJob) {
				setSlot(job.slotKey);
				setPendingKind(job.kind || null);
				if (job.kind && job.value) setRefTarget({
					kind: job.kind,
					value: job.value
				});
				setCurrent({
					report: null,
					screens: []
				});
				startClock(job.ts);
				setWriting(false);
				activeSlotRef.current = "";
				setPhase("scanning");
				(async () => {
					try {
						const info = await designCritiqueApi.pollDiscover(job.discoverJob);
						applyDiscovery(info, {
							kind: job.kind || "",
							value: job.value || ""
						}, job.slotKey);
					} catch (e) {
						const flag = e;
						if (flag && flag.cancelled) return;
						clearJob(job.slotKey);
						setErr(e instanceof Error ? e.message : t("designCritiquePage.that_scan_didn_t_finish"));
						setPhase("error");
					}
				})();
				return;
			}
			clearJob(job.slotKey);
			dropSlot(job.slotKey);
			return;
		}
		if (job.stage === "rendering" && job.renderJob) {
			setSlot(job.slotKey);
			if (job.scope) setScope(normalizeScope(job.scope) || job.scope);
			setPicked(Array.isArray(job.picked) ? job.picked : []);
			setRefBrief(job.refBrief || "");
			setPendingKind(job.kind || null);
			setRefHandle(job.handle || "");
			if (job.kind && job.value) setRefTarget({
				kind: job.kind,
				value: job.value
			});
			setCurrent({
				report: null,
				screens: []
			});
			startClock(job.ts);
			setWriting(false);
			activeSlotRef.current = "";
			setPhase("analyzing");
			(async () => {
				try {
					const out = await designCritiqueApi.pollRender(job.renderJob);
					await critiqueRendered(out, job.slotKey, void 0, job.refBrief || "");
				} catch (e) {
					const flag = e;
					if (flag && flag.cancelled) return;
					clearJob(job.slotKey);
					setErr(e instanceof Error ? e.message : t("designCritiquePage.that_critique_didn_t_finish"));
					setPhase("error");
				}
			})();
			return;
		}
		const uploaded = Array.isArray(job.screens) ? job.screens : [];
		activeSlotRef.current = job.slotKey;
		setSlot(job.slotKey);
		setCurrent({
			report: null,
			screens: uploaded
		});
		startClock(job.ts);
		setWriting(false);
		setPhase("analyzing");
		(async () => {
			try {
				const rep = await pollForReport(job.slotKey);
				finishReport(job.slotKey, uploaded, rep);
			} catch (e) {
				pollingRef.current.delete(job.slotKey);
				const flag = e;
				if (flag && flag.cancelled) return;
				if (flag && flag.timeout) {
					setHint(t("designCritiquePage.still_working_on_this_one_it_s_kept_running_come_2"));
					setPhase("error");
					return;
				}
				endRun(job.slotKey);
				setErr(e instanceof Error ? e.message : t("designCritiquePage.that_critique_didn_t_finish"));
				setPhase("error");
			}
		})();
	}, []);
	useEffect(() => {
		const el = threadRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [asks, openAskId]);
	useEffect(() => {
		if (phase !== "scoping" || !scope || !slot) return;
		saveJob({
			stage: "scoping",
			slotKey: slot,
			kind: pendingKind,
			value: refTarget?.value,
			ts: Date.now(),
			scope,
			picked,
			refBrief,
			handle: refHandle
		});
	}, [
		picked,
		refBrief,
		phase
	]);
	const busy = phase === "uploading" || phase === "analyzing" || phase === "scanning";
	const report = current?.report ?? null;
	const screens = current && current.screens || [];
	const isFlow = screens.length > 1;
	const shown = screens[Math.min(screenIdx, Math.max(0, screens.length - 1))] || null;
	const thumbUrl = shown ? shown.url : "";
	const addFiles = (fileList) => {
		const imgs = Array.from(fileList || []).filter((f) => /^image\//.test(f.type || ""));
		if (!imgs.length) {
			setHint(t("designCritiquePage.those_weren_t_image_files"));
			return;
		}
		setErr("");
		setHint("");
		setStaged((prev) => {
			const room = 20 - prev.length;
			if (room <= 0) {
				setHint(t("designCritiquePage.that_s_the_limit_of_max_screens", { max: 20 }));
				return prev;
			}
			if (imgs.length > room) setHint(t("designCritiquePage.only_added_the_first_room_the_limit_is_max_screens", {
				room,
				max: 20
			}));
			return prev.concat(imgs.slice(0, room).map((f) => ({
				id: f.name + ":" + f.size + ":" + Math.random().toString(36).slice(2, 7),
				file: f,
				url: URL.createObjectURL(f)
			})));
		});
		if (phase === "error") setPhase("new");
	};
	const dropStaged = (i) => setStaged((prev) => {
		const next = prev.slice();
		const [gone] = next.splice(i, 1);
		if (gone) try {
			URL.revokeObjectURL(gone.url);
		} catch {}
		return next;
	});
	const moveStaged = (i, dir) => setStaged((prev) => {
		const j = i + dir;
		if (j < 0 || j >= prev.length) return prev;
		const next = prev.slice();
		const t = next[i];
		next[i] = next[j];
		next[j] = t;
		return next;
	});
	/**
	* Attach a poller to a run that is persisted but unattended. Resume attaches a
	* poller for EVERY analyzing job, not just the newest record, so a critique
	* backgrounded with `+ New` is collected after a page revisit instead of
	* showing a spinner nothing is driving.
	*/
	const resumeAnalyzing = (job) => {
		if (!job.slotKey || pollingRef.current.has(job.slotKey)) return;
		pollingRef.current.add(job.slotKey);
		(async () => {
			const uploaded = Array.isArray(job.screens) ? job.screens : [];
			try {
				const rep = await pollForReport(job.slotKey);
				finishReport(job.slotKey, uploaded, rep);
			} catch (e) {
				failWith(e, job.slotKey);
			} finally {
				pollingRef.current.delete(job.slotKey);
			}
		})();
	};
	/**
	* The "nothing renderable in there" copy, read through normalizeScope so the
	* model's `cannotSee` / `note` cannot put an object into an error string.
	*/
	const discoveryNote = (info) => {
		const sc = normalizeScope(info);
		if (!sc) return "";
		return (sc.cannotSee && sc.cannotSee.length ? sc.cannotSee.join(" ") : "") || sc.note || "";
	};
	const clearStaged = () => setStaged((prev) => {
		prev.forEach((s) => {
			try {
				URL.revokeObjectURL(s.url);
			} catch {}
		});
		return [];
	});
	const onDrop = (e) => {
		e.preventDefault();
		setDragging(false);
		if (!busy) addFiles(e.dataTransfer && e.dataTransfer.files);
	};
	const onDragOver = (e) => {
		e.preventDefault();
		if (!dragging) setDragging(true);
	};
	const onDragLeave = (e) => {
		e.preventDefault();
		setDragging(false);
	};
	const onPick = (e) => {
		addFiles(e.target.files);
		e.target.value = "";
	};
	const pickFile = () => {
		if (inputRef.current) inputRef.current.click();
	};
	const canStart = !busy && (staged.length > 0 || !!refText.trim());
	const start = () => {
		if (!canStart) return;
		if (staged.length) {
			const files = staged.map((s) => s.file);
			clearStaged();
			runImages(files);
		} else runRef(refText);
	};
	const captureSelection = () => {
		const w = window.getSelection && window.getSelection();
		if (!w || w.isCollapsed || !w.rangeCount) {
			setSel(null);
			return;
		}
		const quote = String(w.toString()).replace(/\s+/g, " ").trim();
		if (quote.length < 4 || quote.length > 320) {
			setSel(null);
			return;
		}
		const r = w.getRangeAt(0).getBoundingClientRect();
		if (!r || !r.width && !r.height) {
			setSel(null);
			return;
		}
		setSel({
			quote,
			top: r.top,
			left: r.left + r.width / 2
		});
	};
	const persistAsks = (list) => {
		const key = current && current.entryId;
		if (!key) return;
		const next = loadHistory().map((e) => e.id === key ? {
			...e,
			asks: list
		} : e);
		saveHistory(next);
		setCritiques(next);
	};
	const runTurn = async (askId, question, seedWith) => {
		if (askPending) return;
		setAskPending(true);
		const stamp = Date.now();
		setAsks((prev) => prev.map((a) => a.id === askId ? {
			...a,
			turns: a.turns.concat([{
				t: stamp,
				q: question || "",
				a: "",
				pending: true
			}])
		} : a));
		try {
			if (!askSlotRef.current) {
				const k = await openSlot();
				askSlotRef.current = k;
				await send(k, ASK_CONTEXT(report, screens));
				await pollForText(k, 0).catch(() => {});
			}
			const seen = await slotLength(askSlotRef.current);
			await send(askSlotRef.current, seedWith ? ASK_PROMPT(seedWith, question) : "Follow-up on the same highlighted text: " + (question || "Say more.") + "\n\nSame rules: 2-4 plain sentences, no bullets, no headings.");
			const text = await pollForText(askSlotRef.current, seen);
			setAsks((prev) => {
				const next = prev.map((a) => a.id === askId ? {
					...a,
					turns: a.turns.map((t) => t.t === stamp ? {
						...t,
						a: text,
						pending: false
					} : t)
				} : a);
				persistAsks(next);
				return next;
			});
		} catch (e) {
			const flag = e;
			if (flag && flag.cancelled) return;
			const msg = flag && flag.timeout ? t("designCritiquePage.ask_too_long") : e instanceof Error ? e.message : t("designCritiquePage.ask_went_wrong");
			setAsks((prev) => prev.map((a) => a.id === askId ? {
				...a,
				turns: a.turns.map((t) => t.t === stamp ? {
					...t,
					a: msg,
					pending: false,
					failed: true
				} : t)
			} : a));
			if (openAskIdRef.current === askId) setAskDraft((d) => d || question);
		} finally {
			setAskPending(false);
		}
	};
	const askAbout = (quote, question) => {
		const id = "a" + Date.now();
		setAsks((prev) => prev.concat([{
			id,
			quote,
			turns: []
		}]));
		setOpenAskId(id);
		setSel(null);
		setAskDraft("");
		runTurn(id, question, quote);
	};
	const askFollowUp = (askId, question) => {
		if (!question || !question.trim()) return;
		setAskDraft("");
		runTurn(askId, question.trim(), null);
	};
	const removeAsk = (id) => {
		const next = asks.filter((a) => a.id !== id);
		setAsks(next);
		persistAsks(next);
		if (openAskId === id) setOpenAskId(null);
	};
	const sendScreenshots = () => {
		setPhase("new");
		setCurrent(null);
		setScope(null);
		setPicked([]);
		setErr("");
		setHint("");
		setRefText("");
		setTimeout(() => {
			if (inputRef.current) inputRef.current.click();
		}, 0);
	};
	const critiqueRunning = () => {
		setPhase("new");
		setCurrent(null);
		setScope(null);
		setPicked([]);
		setErr("");
		setHint("");
		setRefText("http://localhost:");
	};
	const cancelRun = () => {
		runSeqRef.current++;
		if (askSlotRef.current) {
			dropSlot(askSlotRef.current);
			askSlotRef.current = "";
		}
		const k = activeSlotRef.current || slot;
		if (k) {
			cancelledRef.current.add(k);
			endRun(k);
		}
		activeSlotRef.current = "";
		setSlot("");
		setScope(null);
		setPicked([]);
		setJustFinished(null);
		setPhase("new");
		setCurrent(null);
		setErr("");
		setHint("");
		setWriting(false);
		setPendingKind(null);
		startedAtRef.current = 0;
		setElapsed(0);
		if (k) setTimeout(() => {
			cancelledRef.current.delete(k);
		}, 2500);
	};
	const newCritique = () => {
		const running = phase === "analyzing" || phase === "uploading";
		runSeqRef.current++;
		clearStaged();
		if (running) {
			const k = activeSlotRef.current;
			if (k) setCritiques(beginPendingCritique(k, current && current.screens || []));
			else if (slot) {
				clearJob(slot);
				setSlot("");
				setScope(null);
				setPicked([]);
				setRefBrief("");
			}
		}
		if (!running && slot) {
			cancelledRef.current.add(slot);
			setTimeout(() => {
				cancelledRef.current.delete(slot);
			}, 2500);
			endRun(slot);
		}
		if (!running) {
			setSlot("");
			setScope(null);
			setPicked([]);
			setRefBrief("");
		}
		setPhase("new");
		setCurrent(null);
		setMenuOpen(false);
		setErr("");
		setHint("");
		setBlocked(null);
		setRefText("");
		startedAtRef.current = 0;
		setElapsed(0);
		setWriting(false);
		setPendingKind(null);
	};
	const openExample = () => {
		setMenuOpen(false);
		showReport(SAMPLE_REPORT, SAMPLE_SCREENS);
	};
	/** Re-attach the view to a run that is still going. */
	const watchRun = (e) => {
		setMenuOpen(false);
		activeSlotRef.current = e.slotKey;
		setSlot(e.slotKey);
		setCurrent({
			report: null,
			screens: e.screens || []
		});
		setJustFinished(null);
		setErr("");
		setHint("");
		setBlocked(null);
		const job = loadJobs().find((j) => j.slotKey === e.slotKey);
		startClock(job && job.ts ? job.ts : e.ts);
		setPhase(e.screens && e.screens.length ? "analyzing" : "scanning");
		if (job && job.stage === "analyzing") resumeAnalyzing(job);
		else if (!job) resumeAnalyzing({
			stage: "analyzing",
			slotKey: e.slotKey,
			screens: e.screens || [],
			ts: e.ts
		});
	};
	const selectCritique = (e) => {
		if (e.pending) {
			watchRun(e);
			return;
		}
		if (!e.report) return;
		setMenuOpen(false);
		const scr = e.screens && e.screens.length ? e.screens : e.thumbUrl ? [{
			step: 1,
			label: "Screen 1",
			url: e.thumbUrl
		}] : [];
		showReport(e.report, scr, e);
	};
	const toggle = (i) => setOpen((prev) => {
		const n = new Set(prev);
		if (n.has(i)) n.delete(i);
		else n.add(i);
		return n;
	});
	const jumpTo = (i) => {
		setActive(i);
		setOpen((prev) => new Set(prev).add(i));
		const el = rowRefs.current[i];
		if (el) el.scrollIntoView({
			behavior: "smooth",
			block: "center"
		});
	};
	const togglePick = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : p.concat([id]));
	const dropPickAt = (id, overId) => setPicked((p) => {
		const from = p.indexOf(id), to = p.indexOf(overId);
		if (from < 0 || to < 0 || from === to) return p;
		const n = p.slice();
		n.splice(from, 1);
		n.splice(to, 0, id);
		return n;
	});
	const movePick = (id, dir) => setPicked((p) => {
		const i = p.indexOf(id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= p.length) return p;
		const n = p.slice();
		const t = n[i];
		n[i] = n[j];
		n[j] = t;
		return n;
	});
	const useFlow = (f) => setPicked((f.screenIds || []).filter((id) => scope ? scope.screens.some((s) => s.id === id) : false));
	const bySev = (a, b) => sevOf(a.severity).rank - sevOf(b.severity).rank;
	const all = report && Array.isArray(report.findings) ? report.findings : [];
	const stepOf = (f) => Array.isArray(f.steps) && f.steps.length ? f.steps[0] : 1;
	const isFlowFinding = (f) => f.scope === "flow" || Array.isArray(f.steps) && f.steps.length > 1;
	const flowFindings = isFlow ? all.filter(isFlowFinding).sort(bySev) : [];
	const screenFindings = all.filter((f) => !isFlow || !isFlowFinding(f)).sort(bySev);
	const idxOf = /* @__PURE__ */ new Map();
	flowFindings.forEach((f, i) => idxOf.set(f, i));
	screenFindings.forEach((f, i) => idxOf.set(f, flowFindings.length + i));
	const pinNo = /* @__PURE__ */ new Map();
	screens.forEach((s) => {
		let n = 0;
		screenFindings.filter((f) => stepOf(f) === s.step).forEach((f) => {
			n += 1;
			pinNo.set(f, n);
		});
	});
	if (!isFlow) screenFindings.forEach((f, i) => pinNo.set(f, i + 1));
	const stepRange = (f) => {
		const st = Array.isArray(f.steps) ? f.steps.slice().sort((a, b) => a - b) : [];
		if (!st.length) return "";
		if (st.length === 1) return String(st[0]);
		if (st.length === 2 && st[1] === st[0] + 1) return st[0] + "→" + st[1];
		return st[0] + "–" + st[st.length - 1];
	};
	const showStepOf = (f) => {
		if (!isFlow) return;
		const i = screens.findIndex((s) => s.step === stepOf(f));
		if (i >= 0) setScreenIdx(i);
	};
	const buildMarkers = (interactive) => screenFindings.filter((f) => !isFlow || shown && stepOf(f) === shown.step).map((f) => {
		const b = f.box;
		if (!b || typeof b.x !== "number") return null;
		const i = idxOf.get(f);
		const s = sevOf(f.severity);
		const on = active === i;
		const cx = (b.x + (b.w || 0) / 2) * 100, cy = (b.y + (b.h || 0) / 2) * 100;
		return /* @__PURE__ */ jsx("span", {
			title: pinNo.get(f) + ". " + f.title,
			role: interactive ? "button" : void 0,
			tabIndex: interactive ? 0 : void 0,
			"aria-label": interactive ? pinNo.get(f) + ". " + f.title : void 0,
			onMouseEnter: () => setActive(i),
			onMouseLeave: () => setActive(null),
			onClick: interactive ? (e) => {
				e.stopPropagation();
				jumpTo(i);
			} : void 0,
			onKeyDown: interactive ? (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
					jumpTo(i);
				}
			} : void 0,
			style: {
				...S.pinMarker,
				left: cx + "%",
				top: cy + "%",
				background: s.color,
				color: readableOn(s.color),
				cursor: interactive ? "pointer" : "default",
				opacity: on ? 1 : .92,
				transform: "translate(-50%, -50%) scale(" + (on ? 1.25 : 1) + ")",
				boxShadow: on ? "0 0 0 3px rgba(0,0,0,.5), 0 0 0 11px color-mix(in srgb, " + s.color + " 22%, transparent)" : "0 0 0 2px rgba(0,0,0,.5)",
				zIndex: on ? 3 : 2
			},
			children: String(pinNo.get(f))
		}, "mk" + i);
	}).filter(Boolean);
	const t$1 = report ? report.tally || {} : {};
	let chips = [
		"catastrophe",
		"major",
		"minor",
		"cosmetic"
	].filter((k) => (t$1[k] || 0) > 0).map((k) => {
		const s = sevOf(k);
		const Icon = s.icon;
		return /* @__PURE__ */ jsxs("span", {
			style: {
				...S.chip,
				color: s.color
			},
			children: [/* @__PURE__ */ jsx(Icon, { size: 12 }), (t$1[k] || 0) + " " + s.label.toLowerCase()]
		}, k);
	});
	if (report && !chips.length) chips = [/* @__PURE__ */ jsxs("span", {
		style: {
			...S.chip,
			color: "#3fae6b"
		},
		children: [/* @__PURE__ */ jsx(Check, { size: 12 }), t("designCritiquePage.nothing_major")]
	}, "ok")];
	const entryMeta = (e) => {
		const n = e.screens && e.screens.length || (e.thumbUrl ? 1 : 0);
		return n > 0 ? t("designCritiquePage.entry_meta_screens", {
			count: n,
			n: fmtNumber(n),
			when: relTime(e.ts)
		}) : relTime(e.ts);
	};
	const railHead = /* @__PURE__ */ jsxs("div", {
		style: S.railHead,
		children: [/* @__PURE__ */ jsxs("div", {
			style: S.title,
			children: [/* @__PURE__ */ jsx(PencilRuler, {
				size: 19,
				style: { color: "var(--accent)" }
			}), t("designCritiquePage.design_critique")]
		}), /* @__PURE__ */ jsxs("div", {
			style: S.railCtrls,
			children: [
				phase !== "new" ? /* @__PURE__ */ jsxs("button", {
					style: S.railBtn,
					onClick: newCritique,
					title: t("designCritiquePage.start_a_new_critique_anything_already_running_ke"),
					children: [/* @__PURE__ */ jsx(Plus, { size: 13 }), t("designCritiquePage.new")]
				}) : null,
				busy ? /* @__PURE__ */ jsxs("button", {
					style: S.runChip,
					onClick: () => {
						setJustFinished(null);
						setPhase(pendingKind && !screens.length ? "scanning" : "analyzing");
					},
					title: t("designCritiquePage.a_critique_is_still_running_click_to_watch_it"),
					children: [/* @__PURE__ */ jsx(Spinner, {
						size: 12,
						reduceMotion
					}), t("designCritiquePage.running")]
				}) : null,
				!busy && justFinished ? /* @__PURE__ */ jsxs("button", {
					style: {
						...S.runChip,
						...S.readyChip
					},
					onClick: () => {
						const mine = loadHistory().find((e) => e.slotKey === justFinished.slotKey);
						if (mine) showReport(justFinished.report, justFinished.screens, mine);
						setJustFinished(null);
					},
					title: justFinished.read,
					children: [/* @__PURE__ */ jsx(Check, { size: 12 }), t("designCritiquePage.critique_ready")]
				}) : null,
				phase !== "new" && critiques.length ? /* @__PURE__ */ jsxs("div", {
					style: { position: "relative" },
					children: [/* @__PURE__ */ jsxs("button", {
						ref: historyBtnRef,
						style: S.railBtn,
						onClick: () => setMenuOpen((o) => !o),
						title: t("designCritiquePage.switch_critique"),
						"aria-expanded": menuOpen,
						"aria-haspopup": "menu",
						"aria-controls": "dc-history-menu",
						children: [t("designCritiquePage.history_count", { n: fmtNumber(critiques.length) }), /* @__PURE__ */ jsx(ChevronDown, { size: 12 })]
					}), menuOpen ? /* @__PURE__ */ jsx("div", {
						style: S.menu,
						id: "dc-history-menu",
						role: "menu",
						ref: historyMenuRef,
						tabIndex: -1,
						"aria-label": t("designCritiquePage.switch_critique"),
						children: critiques.map((e) => /* @__PURE__ */ jsxs("div", {
							role: "menuitem",
							tabIndex: 0,
							style: S.menuItem,
							onClick: () => pickFromHistory(e),
							onKeyDown: (ev) => {
								if (ev.key === "Enter" || ev.key === " ") {
									ev.preventDefault();
									pickFromHistory(e);
								}
							},
							title: e.pending ? t("designCritiquePage.a_critique_is_still_running_click_to_watch_it") : void 0,
							"aria-busy": e.pending || void 0,
							children: [
								e.thumbUrl ? /* @__PURE__ */ jsx("img", {
									src: e.thumbUrl,
									style: S.menuThumb,
									alt: ""
								}) : null,
								/* @__PURE__ */ jsxs("div", {
									style: {
										flex: 1,
										minWidth: 0
									},
									children: [/* @__PURE__ */ jsx("div", {
										style: {
											...S.menuRead,
											...e.pending ? S.pendingRead : {}
										},
										children: e.pending ? t("designCritiquePage.running") : e.read || t("designCritiquePage.critique_untitled")
									}), /* @__PURE__ */ jsx("div", {
										style: S.menuTime,
										children: entryMeta(e)
									})]
								}),
								e.pending ? /* @__PURE__ */ jsx(Spinner, {
									size: 12,
									reduceMotion
								}) : null
							]
						}, e.id))
					}) : null]
				}) : null
			]
		})]
	});
	const withMarks = (text) => {
		const str = String(text || "");
		if (!asks.length || !str) return str;
		const low = str.toLowerCase();
		const hits = asks.map((a) => ({
			a,
			i: low.indexOf(a.quote.toLowerCase())
		})).filter((x) => x.i >= 0).sort((x, y) => x.i - y.i);
		if (!hits.length) return str;
		const out = [];
		let at = 0, n = 0;
		for (const hit of hits) {
			if (hit.i < at) continue;
			if (hit.i > at) out.push(str.slice(at, hit.i));
			out.push(/* @__PURE__ */ jsx("span", {
				style: S.mark,
				role: "button",
				tabIndex: 0,
				title: t("designCritiquePage.your_question_click_to_see_the_answer"),
				onClick: (e) => {
					e.stopPropagation();
					setOpenAskId(hit.a.id);
				},
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						setOpenAskId(hit.a.id);
					}
				},
				children: str.substr(hit.i, hit.a.quote.length)
			}, "mk" + n++));
			at = hit.i + hit.a.quote.length;
		}
		if (at < str.length) out.push(str.slice(at));
		return out;
	};
	const renderRow = (f) => {
		const i = idxOf.get(f);
		const flowScoped = isFlow && isFlowFinding(f);
		return /* @__PURE__ */ jsx(FindingRow, {
			finding: f,
			index: i,
			isOpen: open.has(i),
			isActive: active === i,
			flowScoped,
			pinNum: pinNo.get(f),
			stepRange: stepRange(f),
			withMarks,
			onEnter: () => setActive(i),
			onLeave: () => setActive(null),
			onClick: () => {
				toggle(i);
				if (!flowScoped) showStepOf(f);
			},
			rowRef: (el) => {
				rowRefs.current[i] = el;
			}
		}, i);
	};
	let railBody;
	if (phase === "report" && report) {
		const tightenBlock = isFlow ? [flowFindings.length ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
			style: S.sectionH,
			children: [t("designCritiquePage.across_the_flow"), /* @__PURE__ */ jsx("span", {
				style: {
					fontWeight: 600,
					textTransform: "none"
				},
				children: "· " + flowFindings.length
			})]
		}), flowFindings.map(renderRow)] }, "flow") : null, ...screens.map((sc) => {
			const mine = screenFindings.filter((f) => stepOf(f) === sc.step);
			const onScreen = shown && shown.step === sc.step;
			return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Clickable, {
				style: S.stepH,
				onClick: () => setScreenIdx(screens.indexOf(sc)),
				title: t("designCritiquePage.show_this_screen"),
				children: [
					/* @__PURE__ */ jsx("span", { children: t("designCritiquePage.step_n", { n: fmtNumber(sc.step) }) + " · " }),
					/* @__PURE__ */ jsx("span", {
						style: S.stepName,
						title: sc.label,
						children: shortLabel(sc.label)
					}),
					onScreen ? /* @__PURE__ */ jsx("span", {
						style: {
							...S.stepCount,
							color: "var(--accent)"
						},
						children: t("designCritiquePage.on_screen")
					}) : /* @__PURE__ */ jsx("span", {
						style: {
							...S.stepCount,
							color: "var(--muted)"
						},
						children: mine.length ? t("designCritiquePage.findings_count", {
							count: mine.length,
							n: fmtNumber(mine.length)
						}) : t("designCritiquePage.nothing_flagged")
					})
				]
			}), mine.map(renderRow)] }, "st" + sc.step);
		})] : screenFindings.length ? [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
			style: S.sectionH,
			children: t("designCritiquePage.what_i_d_tighten")
		}), screenFindings.map(renderRow)] }, "wf")] : [];
		railBody = /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("p", {
				style: S.readLine,
				children: withMarks(report.overallRead || t("designCritiquePage.design_critique_fallback"))
			}, "read"),
			report.health || isFlow ? /* @__PURE__ */ jsx("div", {
				style: S.health,
				children: [report.health, isFlow ? " · " + t("designCritiquePage.flow_screens_count", {
					count: screens.length,
					n: fmtNumber(screens.length)
				}) : ""].filter(Boolean).join("")
			}, "hh") : null,
			/* @__PURE__ */ jsx("div", {
				style: S.chips,
				children: chips
			}, "chips"),
			Array.isArray(report.keep) && report.keep.length ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
				style: S.sectionH,
				children: t("designCritiquePage.what_s_working")
			}), report.keep.map((k, i) => /* @__PURE__ */ jsxs("div", {
				style: S.keepItem,
				children: [/* @__PURE__ */ jsx(Check, {
					size: 15,
					style: {
						color: "#3fae6b",
						flexShrink: 0,
						marginTop: "2px"
					}
				}), /* @__PURE__ */ jsx("span", { children: k })]
			}, i))] }, "keep") : null,
			tightenBlock,
			Array.isArray(report.couldNotSee) && report.couldNotSee.length ? /* @__PURE__ */ jsxs("div", { children: [
				/* @__PURE__ */ jsx("div", {
					style: S.sectionH,
					children: t("designCritiquePage.couldn_t_see")
				}),
				report.couldNotSee.map((c, i) => /* @__PURE__ */ jsx("div", {
					style: S.seeItem,
					children: "· " + c
				}, i)),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: "8px",
						marginTop: "10px",
						flexWrap: "wrap"
					},
					children: [/* @__PURE__ */ jsxs("button", {
						style: S.linkBtn,
						onClick: sendScreenshots,
						children: [/* @__PURE__ */ jsx(Upload, { size: 13 }), t("designCritiquePage.send_screenshots")]
					}), /* @__PURE__ */ jsxs("button", {
						style: S.linkBtn,
						onClick: critiqueRunning,
						children: [/* @__PURE__ */ jsx(Image, { size: 13 }), t("designCritiquePage.point_me_at_a_running_url")]
					})]
				})
			] }, "cns") : null
		] });
	} else if (busy) railBody = /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("p", {
			style: S.readLine,
			children: phase === "uploading" ? t("designCritiquePage.rail_uploading") : t("designCritiquePage.rail_reading")
		}, "w"),
		/* @__PURE__ */ jsx("div", {
			style: S.health,
			children: screens.length > 1 ? t("designCritiquePage.rail_flow", {
				count: screens.length,
				n: fmtNumber(screens.length)
			}) : screens.length ? t("designCritiquePage.rail_one_screen") : pendingKind ? railPendingLabel(pendingKind) : t("designCritiquePage.rail_getting_ready")
		}, "sub"),
		screens.length ? /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
			style: S.sectionH,
			children: screens.length > 1 ? t("designCritiquePage.screens_in_order") : t("designCritiquePage.screen_heading")
		}), screens.map((sc, i) => /* @__PURE__ */ jsxs("div", {
			style: {
				...S.seeItem,
				display: "flex",
				gap: "8px"
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--muted)",
					fontVariantNumeric: "tabular-nums"
				},
				children: i + 1 + "."
			}), /* @__PURE__ */ jsx("span", {
				style: {
					flex: 1,
					minWidth: 0,
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap"
				},
				children: sc.label || t("designCritiquePage.screen_n", { n: fmtNumber(i + 1) })
			})]
		}, i))] }, "l") : null,
		/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("div", {
			style: S.sectionH,
			children: t("designCritiquePage.what_you_ll_get")
		}), [
			t("designCritiquePage.get_overall_read"),
			t("designCritiquePage.get_whats_working"),
			t("designCritiquePage.get_top_things")
		].map((tx, i) => /* @__PURE__ */ jsx("div", {
			style: S.seeItem,
			children: "· " + tx
		}, i))] }, "nx")
	] });
	else railBody = /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("p", {
			style: S.sub,
			children: t("designCritiquePage.point_me_at_a_screen_or_a_whole_flow_and_i_ll_re")
		}, "sub"),
		/* @__PURE__ */ jsxs("button", {
			style: S.linkBtn,
			onClick: openExample,
			children: [/* @__PURE__ */ jsx(Sparkle, { size: 13 }), t("designCritiquePage.see_an_example")]
		}, "ex"),
		/* @__PURE__ */ jsx("div", {
			style: S.sectionH,
			children: t("designCritiquePage.your_critiques")
		}, "h"),
		critiques.length ? /* @__PURE__ */ jsx("div", { children: critiques.map((e) => /* @__PURE__ */ jsxs(Clickable, {
			style: S.listItem,
			onClick: () => selectCritique(e),
			title: e.pending ? t("designCritiquePage.a_critique_is_still_running_click_to_watch_it") : void 0,
			"aria-busy": e.pending || void 0,
			children: [
				e.thumbUrl ? /* @__PURE__ */ jsx("img", {
					src: e.thumbUrl,
					style: S.listThumb,
					alt: ""
				}) : null,
				/* @__PURE__ */ jsxs("div", {
					style: {
						flex: 1,
						minWidth: 0
					},
					children: [/* @__PURE__ */ jsx("div", {
						style: {
							...S.listRead,
							...e.pending ? S.pendingRead : {}
						},
						children: e.pending ? t("designCritiquePage.running") : e.read || t("designCritiquePage.critique_untitled")
					}), /* @__PURE__ */ jsx("div", {
						style: S.listTime,
						children: entryMeta(e)
					})]
				}),
				e.pending ? /* @__PURE__ */ jsx(Spinner, {
					size: 13,
					reduceMotion
				}) : /* @__PURE__ */ jsx(ChevronRight, {
					size: 15,
					style: {
						color: "var(--muted)",
						flexShrink: 0
					}
				})
			]
		}, e.id)) }, "list") : /* @__PURE__ */ jsx("div", {
			style: S.emptyList,
			children: narrow ? t("designCritiquePage.no_critiques_narrow") : t("designCritiquePage.no_critiques_wide")
		}, "empty")
	] });
	const railFailures = backgroundFailures.length ? /* @__PURE__ */ jsx("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: "6px",
			marginBottom: "12px"
		},
		children: backgroundFailures.map((f) => /* @__PURE__ */ jsx(ErrorNotice, {
			message: f.message,
			title: t("designCritiquePage.that_critique_didn_t_finish"),
			askAgent: true,
			onDismiss: () => setBackgroundFailures((prev) => prev.filter((x) => x.slotKey !== f.slotKey))
		}, f.slotKey))
	}) : null;
	const rail = /* @__PURE__ */ jsxs("div", {
		style: {
			...S.rail,
			...narrow ? S.railNarrow : {}
		},
		onMouseUp: phase === "report" ? captureSelection : void 0,
		children: [
			railHead,
			railFailures,
			railBody
		]
	});
	let canvasInner;
	if (phase === "scoping" && scope) canvasInner = /* @__PURE__ */ jsx(ScopingPicker, {
		scope,
		picked,
		refBrief,
		dragId,
		togglePick,
		dropPickAt,
		movePick,
		useFlow,
		setDragId,
		setRefBrief,
		runScoped,
		onStartOver: newCritique
	});
	else if (phase === "uploading" || phase === "analyzing" || phase === "scanning") canvasInner = /* @__PURE__ */ jsx(WaitingScreen, {
		phase,
		elapsed,
		writing,
		reduceMotion,
		screens,
		pendingKind,
		onCancel: cancelRun
	});
	else if (phase === "report" && report && thumbUrl) {
		const markers = buildMarkers(true);
		const filmstrip = isFlow ? /* @__PURE__ */ jsx("div", {
			style: S.strip,
			children: screens.map((sc, i) => {
				const mine = screenFindings.filter((f) => stepOf(f) === sc.step);
				const worst = mine.slice().sort(bySev)[0];
				const on = i === screenIdx;
				return /* @__PURE__ */ jsxs("button", {
					style: S.thumb,
					onClick: () => {
						setScreenIdx(i);
						setActive(null);
					},
					title: t("designCritiquePage.step_n", { n: fmtNumber(sc.step) }) + " · " + sc.label,
					"aria-current": on ? "true" : "false",
					children: [/* @__PURE__ */ jsxs("div", {
						style: {
							...S.thumbBox,
							...on ? S.thumbBoxOn : {}
						},
						children: [/* @__PURE__ */ jsx("img", {
							src: sc.url,
							style: S.thumbImg,
							alt: ""
						}), worst ? /* @__PURE__ */ jsxs("span", {
							style: {
								...S.thumbCount,
								color: sevOf(worst.severity).color
							},
							children: [/* @__PURE__ */ jsx("span", { style: {
								width: "6px",
								height: "6px",
								borderRadius: "999px",
								background: sevOf(worst.severity).color,
								display: "inline-block"
							} }), String(mine.length)]
						}) : /* @__PURE__ */ jsx("span", {
							style: {
								...S.thumbCount,
								color: "#3fae6b"
							},
							children: /* @__PURE__ */ jsx(Check, { size: 11 })
						})]
					}), /* @__PURE__ */ jsx("div", {
						style: {
							...S.thumbCap,
							...on ? { color: "var(--text)" } : {}
						},
						children: sc.step + " · " + shortLabel(sc.label)
					})]
				}, "th" + i);
			})
		}) : null;
		canvasInner = /* @__PURE__ */ jsxs(Fragment, { children: [filmstrip, /* @__PURE__ */ jsxs("div", {
			style: S.previewWrap,
			children: [/* @__PURE__ */ jsxs(Clickable, {
				style: S.preview,
				onClick: () => setZoom(true),
				title: t("designCritiquePage.enlarge"),
				children: [/* @__PURE__ */ jsx("img", {
					src: thumbUrl,
					style: S.previewImg,
					alt: shown ? shown.label : t("designCritiquePage.the_design_alt")
				}), markers]
			}), /* @__PURE__ */ jsxs("div", {
				style: S.pvbar,
				children: [/* @__PURE__ */ jsx(Maximize2, { size: 12 }), [
					t("designCritiquePage.click_to_enlarge"),
					markers.length ? t("designCritiquePage.numbered_pins_mark_issues_on_this_screen") : "",
					isFlow ? t("designCritiquePage.pick_a_step_above") : ""
				].filter(Boolean).join(" · ")]
			})]
		})] });
	} else if (phase === "report" && report) canvasInner = /* @__PURE__ */ jsx("div", {
		style: S.previewWrap,
		children: /* @__PURE__ */ jsx("div", {
			style: {
				...S.muted,
				maxWidth: "420px",
				textAlign: "center"
			},
			children: t("designCritiquePage.no_screens_to_show_the_critic_couldn_t_get_pixel")
		})
	});
	else canvasInner = /* @__PURE__ */ jsx(Composer, {
		staged,
		refText,
		dragging,
		blocked,
		showAuth,
		busy,
		err,
		hint,
		inputRef,
		onPick,
		onDrop,
		onDragOver,
		onDragLeave,
		pickFile,
		dropStaged,
		moveStaged,
		clearStaged,
		start,
		setRefText,
		setBlocked,
		setShowAuth,
		onTryAgain: () => runRef(refText)
	});
	const canvas = /* @__PURE__ */ jsx("div", {
		style: S.canvas,
		children: canvasInner
	});
	const lightbox = zoom && thumbUrl ? /* @__PURE__ */ jsx(ZoomLightbox, {
		src: thumbUrl,
		onClose: () => setZoom(false),
		children: buildMarkers(false)
	}) : null;
	return /* @__PURE__ */ jsxs("div", {
		ref: rootRef,
		style: {
			...S.shell,
			...narrow ? { flexDirection: "column" } : {}
		},
		children: [
			rail,
			canvas,
			lightbox,
			phase === "report" ? /* @__PURE__ */ jsx(AskLayer, {
				sel,
				asks,
				openAskId,
				askDraft,
				reduceMotion,
				threadRef,
				setOpenAskId,
				setSel,
				setAskDraft,
				askAbout,
				askFollowUp,
				removeAsk,
				pending: askPending
			}) : null,
			toasts.length ? /* @__PURE__ */ jsx("div", {
				style: S.toastWrap,
				children: toasts.map((t2) => /* @__PURE__ */ jsx("div", {
					style: {
						...S.toast,
						...t2.type === "error" ? {
							borderColor: "var(--error, #e5484d)",
							color: "var(--error, #e5484d)"
						} : {}
					},
					children: t2.msg
				}, t2.id))
			}) : null
		]
	});
}
// src/index.tsx
/**
* The bundle's entry: AppHost lazy-imports this module and renders its default
* export as the app's page.
*
* Subscribing to the host's language generation here is what repaints the page
* on a language switch: `t` reads the active locale at call time, and this
* component's re-render reaches every child. The host's scoped API client is
* bound here too, before the page's first request (see `appApi.ts`).
*/
function DesignCritiqueApp() {
	useLanguageGeneration();
	bindAppApi(useAppApi());
	return /* @__PURE__ */ jsx(DesignCritiquePage, {});
}
export { DesignCritiqueApp as default };
