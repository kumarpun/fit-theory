import Setting from "@/models/Setting";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Setting.sync();
    const settings = await Setting.findAll();

    const settingsObj = {};
    for (const s of settings) {
      settingsObj[s.settingKey] = s.value;
    }

    return Response.json({ success: true, settings: settingsObj });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch settings", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Setting.sync();
    const { deliveryCharge } = await request.json();

    if (deliveryCharge === undefined || deliveryCharge === null || isNaN(Number(deliveryCharge)) || Number(deliveryCharge) < 0) {
      return Response.json(
        { success: false, message: "Valid delivery charge amount is required" },
        { status: 400 }
      );
    }

    const existing = await Setting.findOne({ settingKey: "deliveryCharge" });

    if (existing) {
      await Setting.update(existing.id, { value: String(Number(deliveryCharge).toFixed(2)) });
    } else {
      await Setting.create({ settingKey: "deliveryCharge", value: String(Number(deliveryCharge).toFixed(2)) });
    }

    return Response.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update settings", error: error.message },
      { status: 500 }
    );
  }
}
