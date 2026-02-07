import api from "@/lib/axios";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const search = request.nextUrl.searchParams.get("q")?.trim();
	if (!search)
		return NextResponse.json(
			{ error: "No search query provided" },
			{ status: 400 }
		);

	try {
		const response = await api.get(`/creator/search-sellers?q=${search}`);
		const data = await response.data;
		return NextResponse.json({
			data,
			success: true,
		});
	} catch (error) {
		return NextResponse.json({ error }, { status: 500 });
	}
}
