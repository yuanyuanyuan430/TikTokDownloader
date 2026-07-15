"use strict";

const TASKS = {
  detail: {
    label: "作品解析",
    title: "解析作品与媒体资源",
    description: "粘贴作品分享文本、完整链接，或直接输入作品 ID。",
    submit: "开始解析",
    endpoint: (platform) => `/${platform}/detail`,
    fields: (platform) => [
      {
        name: "resource",
        label: "作品链接或 ID",
        type: "textarea",
        rows: 4,
        required: true,
        wide: true,
        placeholder:
          platform === "douyin"
            ? "例如：https://v.douyin.com/... 或 作品 ID"
            : "例如：https://www.tiktok.com/@user/video/... 或 作品 ID",
        help: "短链接会先通过后端展开，再提取作品 ID。",
      },
    ],
  },
  account: {
    label: "账号作品",
    title: "读取账号发布与喜欢作品",
    description: "使用 sec_user_id 获取账号作品，支持页数和日期范围限制。",
    submit: "读取账号",
    endpoint: (platform) => `/${platform}/account`,
    fields: (platform) => [
      {
        name: "sec_user_id",
        label: "账号 sec_user_id",
        type: "text",
        required: true,
        wide: true,
        placeholder: "输入平台账号的 sec_user_id",
      },
      {
        name: "tab",
        label: "作品类型",
        type: "select",
        value: "post",
        options: [
          ["post", "发布作品"],
          ["favorite", "喜欢作品"],
        ],
      },
      {
        name: "pages",
        label: "最大页数",
        type: "number",
        min: 1,
        placeholder: "不限",
      },
      {
        name: "earliest",
        label: "最早发布日期",
        type: "date",
      },
      {
        name: "latest",
        label: "最晚发布日期",
        type: "date",
      },
      {
        name: "count",
        label: "每页数量",
        type: "number",
        min: 1,
        value: platform === "douyin" ? 18 : 30,
      },
    ],
  },
  mix: {
    label: "合集内容",
    title: "批量读取合集作品",
    description: "输入合集 ID。抖音也可以使用合集内任一作品 ID 定位合集。",
    submit: "读取合集",
    endpoint: (platform) => `/${platform}/mix`,
    fields: (platform) => [
      ...(platform === "douyin"
        ? [
            {
              name: "id_type",
              label: "定位方式",
              type: "select",
              value: "mix_id",
              options: [
                ["mix_id", "合集 ID"],
                ["detail_id", "合集内作品 ID"],
              ],
            },
          ]
        : []),
      {
        name: "id_value",
        label: platform === "douyin" ? "合集或作品 ID" : "合集 ID",
        type: "text",
        required: true,
        wide: platform === "tiktok",
        placeholder: "输入数字 ID",
      },
      {
        name: "cursor",
        label: "起始游标",
        type: "number",
        min: 0,
        value: 0,
      },
      {
        name: "count",
        label: "每页数量",
        type: "number",
        min: 1,
        value: platform === "douyin" ? 12 : 30,
      },
    ],
  },
  live: {
    label: "直播信息",
    title: "获取直播间与拉流信息",
    description: "抖音使用 web_rid，TikTok 使用 room_id。",
    submit: "获取直播",
    endpoint: (platform) => `/${platform}/live`,
    fields: (platform) => [
      {
        name: platform === "douyin" ? "web_rid" : "room_id",
        label: platform === "douyin" ? "直播 web_rid" : "直播 room_id",
        type: "text",
        required: true,
        wide: true,
        placeholder: "输入直播间 ID",
      },
    ],
  },
  comment: {
    label: "作品评论",
    title: "读取抖音作品评论",
    description: "按作品 ID 获取评论，可选同时读取部分回复。",
    submit: "读取评论",
    platforms: ["douyin"],
    endpoint: () => "/douyin/comment",
    fields: () => [
      {
        name: "detail_id",
        label: "作品 ID",
        type: "text",
        required: true,
        wide: true,
        placeholder: "输入抖音作品 ID",
      },
      {
        name: "pages",
        label: "最大页数",
        type: "number",
        min: 1,
        value: 1,
      },
      {
        name: "count",
        label: "每页评论数",
        type: "number",
        min: 1,
        value: 20,
      },
      {
        name: "count_reply",
        label: "每条评论回复数",
        type: "number",
        min: 1,
        value: 3,
      },
      {
        name: "reply",
        label: "同时读取评论回复",
        type: "checkbox",
        help: "开启后请求时间和结果体积会增加。",
        wide: true,
      },
    ],
  },
  search: {
    label: "内容搜索",
    title: "搜索抖音公开内容",
    description: "按关键词搜索综合、视频、用户或直播数据。",
    submit: "开始搜索",
    platforms: ["douyin"],
    endpoint: (_platform, values = {}) =>
      `/douyin/search/${values.search_type || "general"}`,
    fields: () => [
      {
        name: "search_type",
        label: "搜索类型",
        type: "select",
        value: "general",
        options: [
          ["general", "综合"],
          ["video", "视频"],
          ["user", "用户"],
          ["live", "直播"],
        ],
      },
      {
        name: "keyword",
        label: "关键词",
        type: "text",
        required: true,
        placeholder: "输入搜索关键词",
      },
      {
        name: "pages",
        label: "搜索页数",
        type: "number",
        min: 1,
        value: 1,
      },
      {
        name: "count",
        label: "每页数量",
        type: "number",
        min: 5,
        value: 10,
      },
    ],
  },
};

const state = {
  platform: "douyin",
  task: "detail",
  lastResult: null,
  toastTimer: null,
};

const elements = {
  body: document.body,
  sidebar: document.querySelector("#sidebar"),
  scrim: document.querySelector("#sidebar-scrim"),
  menuToggle: document.querySelector("#menu-toggle"),
  navItems: [...document.querySelectorAll("[data-task]")],
  platformButtons: [...document.querySelectorAll("[data-platform]")],
  sectionContext: document.querySelector("#section-context"),
  pageTitle: document.querySelector("#page-title"),
  taskDescription: document.querySelector("#task-description"),
  endpoint: document.querySelector("#endpoint-label"),
  form: document.querySelector("#request-form"),
  dynamicFields: document.querySelector("#dynamic-fields"),
  submit: document.querySelector("#submit-button"),
  cookie: document.querySelector("#cookie"),
  proxy: document.querySelector("#proxy"),
  token: document.querySelector("#token"),
  source: document.querySelector("#source"),
  status: document.querySelector(".api-state"),
  statusText: document.querySelector("#status-text"),
  empty: document.querySelector("#empty-state"),
  loading: document.querySelector("#loading-state"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
  content: document.querySelector("#result-content"),
  actions: document.querySelector("#result-actions"),
  resultSubtitle: document.querySelector("#result-subtitle"),
  summaryStatus: document.querySelector("#summary-status"),
  summaryCount: document.querySelector("#summary-count"),
  summaryDuration: document.querySelector("#summary-duration"),
  mediaSection: document.querySelector("#media-section"),
  mediaCount: document.querySelector("#media-count"),
  mediaList: document.querySelector("#media-list"),
  json: document.querySelector("#json-output"),
  copy: document.querySelector("#copy-result"),
  download: document.querySelector("#download-result"),
  toast: document.querySelector("#toast"),
};

function createField(config) {
  if (config.type === "checkbox") {
    const label = document.createElement("label");
    label.className = `check-field${config.wide ? " field-wide" : ""}`;
    label.htmlFor = config.name;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = config.name;
    input.name = config.name;

    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = config.label;
    copy.append(title);
    if (config.help) {
      const help = document.createElement("small");
      help.textContent = config.help;
      copy.append(help);
    }
    label.append(input, copy);
    return label;
  }

  const wrapper = document.createElement("div");
  wrapper.className = `field${config.wide ? " field-wide" : ""}`;

  const label = document.createElement("label");
  label.htmlFor = config.name;
  label.textContent = config.label;

  let input;
  if (config.type === "select") {
    input = document.createElement("select");
    for (const [value, text] of config.options) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      input.append(option);
    }
  } else if (config.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = config.rows || 3;
  } else {
    input = document.createElement("input");
    input.type = config.type || "text";
  }

  input.id = config.name;
  input.name = config.name;
  input.required = Boolean(config.required);
  input.autocomplete = "off";
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.value !== undefined) input.value = config.value;
  if (config.min !== undefined) input.min = String(config.min);
  if (config.max !== undefined) input.max = String(config.max);
  input.addEventListener("input", () => clearFieldError(input));
  input.addEventListener("change", updateEndpointLabel);

  wrapper.append(label, input);
  if (config.help) {
    const help = document.createElement("p");
    help.className = "field-help";
    help.textContent = config.help;
    wrapper.append(help);
  }

  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `${config.name}-error`;
  error.hidden = true;
  wrapper.append(error);
  return wrapper;
}

function renderTask() {
  const task = TASKS[state.task];
  elements.sectionContext.textContent = task.label;
  elements.pageTitle.textContent = task.title;
  elements.taskDescription.textContent = task.description;
  elements.submit.textContent = task.submit;
  elements.dynamicFields.replaceChildren(
    ...task.fields(state.platform).map(createField),
  );

  elements.navItems.forEach((item) => {
    const isActive = item.dataset.task === state.task;
    const platforms = item.dataset.platforms?.split(",") || ["douyin", "tiktok"];
    item.classList.toggle("is-active", isActive);
    item.classList.toggle("is-unavailable", !platforms.includes(state.platform));
    item.setAttribute("aria-current", isActive ? "page" : "false");
  });

  elements.platformButtons.forEach((button) => {
    const isActive = button.dataset.platform === state.platform;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  updateEndpointLabel();
}

function readDynamicValues() {
  const values = {};
  for (const input of elements.dynamicFields.querySelectorAll("input, select, textarea")) {
    values[input.name] = input.type === "checkbox" ? input.checked : input.value.trim();
  }
  return values;
}

function updateEndpointLabel() {
  const task = TASKS[state.task];
  elements.endpoint.textContent = `POST ${task.endpoint(state.platform, readDynamicValues())}`;
}

function clearFieldError(input) {
  input.removeAttribute("aria-invalid");
  const error = document.querySelector(`#${CSS.escape(input.name)}-error`);
  if (error) {
    error.hidden = true;
    error.textContent = "";
  }
}

function setFieldError(input, message) {
  input.setAttribute("aria-invalid", "true");
  const error = document.querySelector(`#${CSS.escape(input.name)}-error`);
  if (error) {
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-describedby", error.id);
  }
}

function validateForm() {
  let firstInvalid = null;
  for (const input of elements.dynamicFields.querySelectorAll("input, select, textarea")) {
    clearFieldError(input);
    const value = input.type === "checkbox" ? input.checked : input.value.trim();
    if (input.required && !value) {
      setFieldError(input, "请填写此项。" );
      firstInvalid ||= input;
      continue;
    }
    if (input.type === "number" && value && !input.validity.valid) {
      setFieldError(input, `请输入不小于 ${input.min || 0} 的数字。`);
      firstInvalid ||= input;
    }
  }

  const earliest = elements.dynamicFields.querySelector("[name='earliest']");
  const latest = elements.dynamicFields.querySelector("[name='latest']");
  if (earliest?.value && latest?.value && earliest.value > latest.value) {
    setFieldError(latest, "最晚日期不能早于最早日期。" );
    firstInvalid ||= latest;
  }

  firstInvalid?.focus();
  return !firstInvalid;
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null),
  );
}

function commonPayload() {
  return cleanPayload({
    cookie: elements.cookie.value.trim(),
    proxy: elements.proxy.value.trim(),
    source: elements.source.checked,
  });
}

function numberOrUndefined(value) {
  return value === "" || value === undefined ? undefined : Number(value);
}

function extractDetailId(value, platform) {
  const trimmed = value.trim();
  if (/^\d{8,}$/.test(trimmed)) return trimmed;

  const patterns =
    platform === "douyin"
      ? [/(?:video|note)\/(\d{8,})/i, /(?:modal_id|aweme_id)=(\d{8,})/i]
      : [/(?:video|photo)\/(\d{8,})/i, /(?:item_id|itemId)=(\d{8,})/i];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return "";
}

async function buildRequest(values) {
  const common = commonPayload();
  const task = TASKS[state.task];
  const endpoint = task.endpoint(state.platform, values);

  if (state.task === "detail") {
    let detailId = extractDetailId(values.resource, state.platform);
    if (!detailId) {
      const resolved = await apiRequest(
        `/${state.platform}/share`,
        cleanPayload({ text: values.resource, proxy: common.proxy }),
      );
      detailId = extractDetailId(resolved.url || values.resource, state.platform);
    }
    if (!detailId) {
      throw new Error("没有从输入内容中识别出作品 ID，请检查链接或直接输入 ID。" );
    }
    return { endpoint, payload: { ...common, detail_id: detailId } };
  }

  if (state.task === "account") {
    return {
      endpoint,
      payload: cleanPayload({
        ...common,
        sec_user_id: values.sec_user_id,
        tab: values.tab,
        earliest: values.earliest,
        latest: values.latest,
        pages: numberOrUndefined(values.pages),
        count: numberOrUndefined(values.count),
      }),
    };
  }

  if (state.task === "mix") {
    const idKey = state.platform === "douyin" ? values.id_type : "mix_id";
    return {
      endpoint,
      payload: cleanPayload({
        ...common,
        [idKey]: values.id_value,
        cursor: numberOrUndefined(values.cursor),
        count: numberOrUndefined(values.count),
      }),
    };
  }

  if (state.task === "live") {
    const idKey = state.platform === "douyin" ? "web_rid" : "room_id";
    return { endpoint, payload: { ...common, [idKey]: values[idKey] } };
  }

  if (state.task === "comment") {
    return {
      endpoint,
      payload: cleanPayload({
        ...common,
        detail_id: values.detail_id,
        pages: numberOrUndefined(values.pages),
        count: numberOrUndefined(values.count),
        count_reply: numberOrUndefined(values.count_reply),
        reply: values.reply,
      }),
    };
  }

  return {
    endpoint,
    payload: cleanPayload({
      ...common,
      keyword: values.keyword,
      pages: numberOrUndefined(values.pages),
      count: numberOrUndefined(values.count),
    }),
  };
}

function formatErrorBody(body, status) {
  if (Array.isArray(body?.detail)) {
    return body.detail
      .map((item) => `${item.loc?.slice(1).join(".") || "参数"}: ${item.msg}`)
      .join("；");
  }
  return body?.detail || body?.message || `请求失败，HTTP ${status}`;
}

async function apiRequest(path, payload) {
  const headers = { "Content-Type": "application/json" };
  const token = elements.token.value.trim();
  if (token) headers.token = token;

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : { detail: await response.text() };
  if (!response.ok) throw new Error(formatErrorBody(body, response.status));
  return body;
}

function setResultView(view) {
  elements.empty.hidden = view !== "empty";
  elements.loading.hidden = view !== "loading";
  elements.error.hidden = view !== "error";
  elements.content.hidden = view !== "content";
  elements.actions.hidden = view !== "content";
}

function resetResult() {
  state.lastResult = null;
  elements.resultSubtitle.textContent = "完成请求后，可查看媒体资源和完整响应。";
  elements.mediaList.replaceChildren();
  elements.json.textContent = "";
  setResultView("empty");
}

function countItems(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") return 1;
  return 0;
}

const MEDIA_LABELS = {
  downloads: "媒体资源",
  music_url: "作品音乐",
  static_cover: "静态封面",
  dynamic_cover: "动态封面",
  share_url: "作品页面",
  avatar: "账号头像",
  cover: "封面图片",
  flv: "FLV 拉流",
  m3u8: "M3U8 拉流",
};

function labelForPath(path) {
  const key = path.split(".").at(-1)?.replace(/\[\d+\]/g, "") || "resource";
  const matched = Object.entries(MEDIA_LABELS).find(([name]) => key.includes(name));
  return matched?.[1] || "外部资源";
}

function collectMedia(data) {
  const items = [];
  const seen = new Set();
  const usefulPath = /(download|cover|music|share_url|avatar|play|flv|m3u8|image|url)/i;

  function visit(value, path = "data") {
    if (items.length >= 24) return;
    if (typeof value === "string" && /^https?:\/\//i.test(value) && usefulPath.test(path)) {
      if (!seen.has(value)) {
        seen.add(value);
        items.push({
          url: value,
          path,
          label: labelForPath(path),
          preview: /(cover|avatar|image)/i.test(path),
        });
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`));
    }
  }

  visit(data);
  return items;
}

function localMediaUrl(url) {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.douyin.com" &&
      parsed.pathname.replace(/\/$/, "") === "/aweme/v1/play"
    ) {
      return `/media?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }
  return url;
}

function renderMedia(items) {
  elements.mediaList.replaceChildren();
  elements.mediaSection.hidden = items.length === 0;
  if (!items.length) return;

  elements.mediaCount.textContent = `共 ${items.length} 个链接`;
  for (const [index, item] of items.entries()) {
    const row = document.createElement("article");
    row.className = "media-item";

    let visual;
    if (item.preview) {
      visual = document.createElement("img");
      visual.className = "media-preview";
      visual.src = item.url;
      visual.alt = "";
      visual.loading = "lazy";
      visual.referrerPolicy = "no-referrer";
      visual.addEventListener("error", () => {
        const fallback = document.createElement("span");
        fallback.className = "media-kind";
        fallback.textContent = "IMG";
        visual.replaceWith(fallback);
      });
    } else {
      visual = document.createElement("span");
      visual.className = "media-kind";
      visual.textContent = item.label.includes("页面") ? "URL" : "MEDIA";
    }

    const copy = document.createElement("div");
    copy.className = "media-copy";
    const title = document.createElement("strong");
    title.textContent = `${item.label} ${index + 1}`;
    const path = document.createElement("small");
    path.textContent = item.path;
    copy.append(title, path);

    const link = document.createElement("a");
    const href = localMediaUrl(item.url);
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = href === item.url ? "打开" : "播放";
    row.append(visual, copy, link);
    elements.mediaList.append(row);
  }
}

function renderResult(result, duration) {
  state.lastResult = result;
  const dataCount = countItems(result.data);
  const media = collectMedia(result.data);
  elements.summaryStatus.textContent = result.message || "请求完成";
  elements.summaryCount.textContent = String(dataCount);
  elements.summaryDuration.textContent = `${Math.round(duration)} ms`;
  elements.resultSubtitle.textContent = result.time
    ? `后端响应时间 ${result.time}`
    : "请求已完成。";
  elements.json.textContent = JSON.stringify(result, null, 2);
  renderMedia(media);
  setResultView("content");
}

function showError(error) {
  elements.errorMessage.textContent = error.message || "发生未知错误。";
  elements.resultSubtitle.textContent = "请检查输入参数、Cookie 和后端日志。";
  setResultView("error");
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 2400);
}

async function submitTask(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const originalLabel = elements.submit.textContent;
  elements.submit.disabled = true;
  elements.submit.textContent = "请求中";
  elements.resultSubtitle.textContent = "正在等待后端响应。";
  setResultView("loading");
  const start = performance.now();

  try {
    const request = await buildRequest(readDynamicValues());
    elements.endpoint.textContent = `POST ${request.endpoint}`;
    const result = await apiRequest(request.endpoint, request.payload);
    renderResult(result, performance.now() - start);
  } catch (error) {
    showError(error);
  } finally {
    elements.submit.disabled = false;
    elements.submit.textContent = originalLabel;
  }
}

async function copyResult() {
  if (!state.lastResult) return;
  const text = JSON.stringify(state.lastResult, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    showToast("JSON 已复制");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    showToast("JSON 已复制");
  }
}

function downloadResult() {
  if (!state.lastResult) return;
  const blob = new Blob([JSON.stringify(state.lastResult, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `douk-${state.platform}-${state.task}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function setSidebar(open) {
  const wasOpen = elements.body.classList.contains("sidebar-open");
  elements.body.classList.toggle("sidebar-open", open);
  elements.menuToggle.setAttribute("aria-expanded", String(open));
  if (window.matchMedia("(max-width: 860px)").matches) {
    if (open) {
      window.setTimeout(() => {
        if (elements.body.classList.contains("sidebar-open")) {
          elements.sidebar.querySelector(".nav-item")?.focus();
        }
      }, 190);
    } else if (wasOpen) {
      window.setTimeout(() => elements.menuToggle.focus(), 0);
    }
  }
}

function selectTask(taskName) {
  const task = TASKS[taskName];
  if (task.platforms && !task.platforms.includes(state.platform)) {
    state.platform = task.platforms[0];
    showToast("该功能仅支持抖音，已自动切换平台");
  }
  state.task = taskName;
  renderTask();
  resetResult();
  setSidebar(false);
}

function selectPlatform(platform) {
  state.platform = platform;
  const task = TASKS[state.task];
  if (task.platforms && !task.platforms.includes(platform)) {
    state.task = "detail";
    showToast("当前功能不支持该平台，已切换到作品解析");
  }
  renderTask();
  resetResult();
}

async function checkApi() {
  elements.status.classList.remove("is-online", "is-offline");
  try {
    const token = elements.token.value.trim();
    const response = await fetch("/token", {
      cache: "no-store",
      headers: token ? { token } : {},
    });
    if (!response.ok) throw new Error();
    elements.status.classList.add("is-online");
    elements.statusText.textContent = "API 已连接";
  } catch {
    elements.status.classList.add("is-offline");
    elements.statusText.textContent = "API 连接失败";
  }
}

elements.form.addEventListener("submit", submitTask);
elements.token.addEventListener("change", checkApi);
elements.copy.addEventListener("click", copyResult);
elements.download.addEventListener("click", downloadResult);
elements.menuToggle.addEventListener("click", () => {
  setSidebar(!elements.body.classList.contains("sidebar-open"));
});
elements.scrim.addEventListener("click", () => setSidebar(false));
elements.navItems.forEach((item) => {
  item.addEventListener("click", () => selectTask(item.dataset.task));
});
elements.platformButtons.forEach((button) => {
  button.addEventListener("click", () => selectPlatform(button.dataset.platform));
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setSidebar(false);
});

renderTask();
setResultView("empty");
checkApi();
