import { type RouteConfig, index, route } from "@react-router/dev/routes";

// 最小限の設定で試してみる
export default [

    route("dashboard", "routes/dashboard/dashboard.tsx"),
    route("inventory", "routes/inventory/inventory.tsx"),
    // route("/operations/inbound", "routes/operations/inbound.tsx"),
    // route("operations", "routes/operations/index.tsx", [
    //   route("inbound", "routes/operations/inbound.tsx"), 
    //   route("reservation", "routes/operations/reservation.tsx"),
    //   route("outbound", "routes/operations/outbound.tsx"),
    //   route("reinbound", "routes/operations/reinbound.tsx"),
    // ]),


    route("operations", "routes/operations/index.tsx", [
      route("inbound", "routes/operations/inbound.tsx"),
      route("reservation", "routes/operations/reservation.tsx"),
      route("outbound", "routes/operations/outbound.tsx"),
      route("reinbound", "routes/operations/reinbound.tsx"),
    ]),
    // "/master" 以下のネストされたルート
    route("master", "routes/master/index.tsx", [
      route("materials", "routes/master/materials.tsx"),
      route("suppliers", "routes/master/suppliers.tsx"),
      route("manufacturers", "routes/master/manufacturers.tsx"),
      // route("vessels", "routes/master/vessels.tsx"),
    ]),

] satisfies RouteConfig;
