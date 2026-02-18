import Setting from "@/models/Setting";

export async function GET() {
  try {
    await Setting.sync();
    const setting = await Setting.findOne({ settingKey: "deliveryCharge" });
    const deliveryCharge = setting ? Number(setting.value) : 0;

    const codSetting = await Setting.findOne({ settingKey: "codEnabled" });
    const codEnabled = codSetting ? codSetting.value !== "0" : true;

    return Response.json({ success: true, deliveryCharge, codEnabled });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch delivery charge", error: error.message },
      { status: 500 }
    );
  }
}
