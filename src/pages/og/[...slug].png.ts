import { Resvg } from "@resvg/resvg-js";
import type { APIContext } from "astro";
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { profileConfig, siteConfig } from "@/config";
import { formatDateToYYYYMMDD } from "@utils/date-utils";
import { getSortedPosts } from "@utils/content-utils";

// 静态 OTF（可变字体 satori 不支持），构建期加载一次
// 构建时 cwd 是项目根目录，直接从这里解析
const font: Buffer = fs.readFileSync(
	path.resolve(process.cwd(), "src/assets/fonts/NotoSansSC-Regular.otf"),
);

interface OgProps {
	title: string;
	date?: string;
	category?: string;
}

export async function getStaticPaths() {
	const posts = await getSortedPosts();
	return [
		{
			params: { slug: "site" },
			props: {
				title: siteConfig.title,
				category: siteConfig.subtitle,
			} as OgProps,
		},
		...posts.map((p) => ({
			params: { slug: p.slug },
			props: {
				title: p.data.title,
				date: formatDateToYYYYMMDD(p.data.published),
				category: p.data.category,
			} as OgProps,
		})),
	];
}

// 简易断行：按每行字数粗略换行，最多两行，超出加省略号
function wrapTitle(title: string, perLine = 15, maxLines = 2): string[] {
	const lines: string[] = [];
	let rest = title.trim();
	while (rest.length > perLine && lines.length < maxLines - 1) {
		lines.push(rest.slice(0, perLine));
		rest = rest.slice(perLine);
	}
	if (rest.length > perLine) {
		rest = rest.slice(0, perLine - 1) + "…";
	}
	lines.push(rest);
	return lines.slice(0, maxLines);
}

export async function GET({ props }: APIContext) {
	const { title, date, category } = props as OgProps;
	const accent = `hsl(${siteConfig.themeColor.hue} 80% 68%)`;
	const lines = wrapTitle(title);

	const svg = await satori(
		{
			type: "div",
			props: {
				style: {
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					padding: "64px",
					background:
						"linear-gradient(135deg, #0b1020 0%, #171b34 60%, #1e1b4b 100%)",
					color: "white",
					fontFamily: "Noto Sans SC",
				},
				children: [
					// 顶栏：站名
					{
						type: "div",
						props: {
							style: { display: "flex", alignItems: "center", gap: "16px" },
							children: [
								{
									type: "div",
									props: {
										style: {
											width: "12px",
											height: "44px",
											borderRadius: "6px",
											background: accent,
										},
									},
								},
								{
									type: "div",
									props: {
										style: {
											fontSize: "30px",
											fontWeight: 500,
											color: "rgba(255,255,255,0.85)",
										},
										children: siteConfig.title,
									},
								},
							],
						},
					},
					// 标题
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								flexDirection: "column",
								gap: "8px",
							},
							children: lines.map((line) => ({
								type: "div",
								props: {
									style: {
										fontSize: "58px",
										fontWeight: 700,
										lineHeight: 1.35,
									},
									children: line,
								},
							})),
						},
					},
					// 底栏：分类 + 日期/作者
					{
						type: "div",
						props: {
							style: {
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							},
							children: [
								{
									type: "div",
									props: {
										style: {
											fontSize: "24px",
											padding: "6px 20px",
											borderRadius: "999px",
											background: "rgba(255,255,255,0.12)",
										},
										children: category || "",
									},
								},
								{
									type: "div",
									props: {
										style: {
											fontSize: "24px",
											color: "rgba(255,255,255,0.6)",
										},
										children:
											[date, profileConfig.name].filter(Boolean).join("  ·  ") ||
											profileConfig.name,
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{ name: "Noto Sans SC", data: font, weight: 400, style: "normal" },
			],
		} as any,
	);

	const png = new Resvg(svg, {
		fitTo: { mode: "width", value: 1200 },
	}).render().asPng();

	return new Response(new Uint8Array(png), {
		headers: { "Content-Type": "image/png" },
	});
}
