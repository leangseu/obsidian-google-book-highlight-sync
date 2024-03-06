import { docs_v1 } from "@googleapis/docs";
import { GDocProcessorOutput } from "./types";

export async function processGDoc(
	doc: docs_v1.Schema$Document
): Promise<GDocProcessorOutput> {
	const lines: string[] = [];
	doc.body?.content?.forEach((item) => {
		/**
		 * Tables
		 */
		if (item.table?.tableRows) {
			processTable(item.table, lines);
		}

		/**
		 * Paragraphs and lists
		 */
		if (item.paragraph) {
			processParagraph(item.paragraph, lines);
		}
	});

	return {
		doc_name: doc.title,
		doc_id: doc.documentId,
		doc_url: `https://docs.google.com/document/d/${doc.documentId}`,
		book_name: lines[0].substring(3).trim(),
		book_author: lines[1],
		book_publisher: lines[2],
		markdown_content: lines.join("\n"),
	};
}

function processTable(table: docs_v1.Schema$Table, lines: string[]): void {
	table.tableRows?.forEach((row) => {
		row.tableCells?.forEach((cell) => {
			cell.content?.forEach((content) => {
				if (content.table) {
					processTable(content.table, lines);
				}
				if (content.paragraph) {
					processParagraph(content.paragraph, lines);
				}
			});
		});
	});
}

function processParagraph(
	paragraph: docs_v1.Schema$Paragraph,
	lines: string[]
) {
	const styleType = paragraph?.paragraphStyle?.namedStyleType || undefined;
	paragraph.elements?.forEach((element) => {
		const line = element.textRun?.content?.trim()
			? styleElement(element, styleType)
			: null;
		if (line) {
			lines.push(line);
		}
	});
}

function styleElement(
	element: docs_v1.Schema$ParagraphElement,
	styleType?: string
): string | undefined {
	if (styleType === "TITLE") {
		return `# ${content(element)}`;
	} else if (styleType === "SUBTITLE") {
		return `_${(content(element) || "").trim()}_`;
	} else if (styleType === "HEADING_1") {
		return `## ${content(element)}`;
	} else if (styleType === "HEADING_2") {
		return `### ${content(element)}`;
	} else if (styleType === "HEADING_3") {
		return `#### ${content(element)}`;
	} else if (styleType === "HEADING_4") {
		return `##### ${content(element)}`;
	} else if (styleType === "HEADING_5") {
		return `###### ${content(element)}`;
	} else if (styleType === "HEADING_6") {
		return `####### ${content(element)}`;
	}

	return content(element);
}

function content(element: docs_v1.Schema$ParagraphElement): string | undefined {
	const textRun = element?.textRun;
	const text = textRun?.content?.trim();

	if (
		[
			`This document is overwritten when you make changes in Play Books.`,
			`You should make a copy of this document before you edit it.`,
		].includes(text || "")
	) {
		return undefined;
	}
	// TODO: we can add custom format to this since we each and everyone of it component.
	// quote highlight
	if (textRun.textStyle.backgroundColor) {
		return `> [!quote]+\n> ${text}`;
	}
	else if (
		textRun.textStyle.fontSize?.magnitude === 11 &&
		textRun.textStyle.baselineOffset === "NONE"
	) {
		if (
			Object.values(textRun.textStyle.foregroundColor.color.rgbColor)?.every(
				(color) => color === 0.25882354
			)
		) {
			// note text
			return `> ***${text}***`;
		} else {
			// hightlight date
			return `> _${text}_`;
		}
	}
	// google play page and book url
	else if (textRun?.textStyle?.link?.url) {
		return `> [Page ${text}](${textRun.textStyle.link.url})\n`;
	}

	return text || undefined;
}
