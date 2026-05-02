import Foundation

enum PropertyType: String, CaseIterable, Identifiable, Codable {
    case residentialBuilding = "سكني - عمارة"
    case residentialVillas = "سكني - فلل"
    case commercialMall = "تجاري - مجمع تجاري"
    case commercialShowrooms = "تجاري - معارض"
    case industrialWorkshops = "صناعي - ورش"
    case industrialWarehouses = "صناعي - مستودعات"
    case hospitalityServicedApartments = "فندقي - شقق مخدومة"
    case rawLandDevelopment = "أرض خام / تطوير أرض"

    var id: String { rawValue }

    var iconName: String {
        switch self {
        case .residentialBuilding: return "building.2.fill"
        case .residentialVillas: return "house.lodge.fill"
        case .commercialMall: return "storefront.fill"
        case .commercialShowrooms: return "rectangle.grid.2x2.fill"
        case .industrialWorkshops: return "wrench.and.screwdriver.fill"
        case .industrialWarehouses: return "shippingbox.fill"
        case .hospitalityServicedApartments: return "bed.double.fill"
        case .rawLandDevelopment: return "map.fill"
        }
    }

    var unitLabel: String {
        switch self {
        case .residentialBuilding: return "عدد الشقق"
        case .residentialVillas: return "عدد الفلل"
        case .commercialMall: return "عدد المحلات"
        case .commercialShowrooms: return "عدد المعارض"
        case .industrialWorkshops: return "عدد الورش"
        case .industrialWarehouses: return "عدد المستودعات"
        case .hospitalityServicedApartments: return "عدد الغرف"
        case .rawLandDevelopment: return "عدد القطع أو الوحدات"
        }
    }

    var rentLabel: String {
        switch self {
        case .hospitalityServicedApartments: return "متوسط سعر الليلة ADR"
        case .industrialWarehouses: return "متوسط إيجار المستودع الشهري"
        default: return "متوسط الإيجار الشهري للوحدة"
        }
    }

    var additionalIncomeLabel: String {
        switch self {
        case .commercialMall: return "دخل اللوحات أو المواقف"
        case .hospitalityServicedApartments: return "إيرادات إضافية"
        case .industrialWarehouses: return "دخل خدمات أو ساحات إضافية"
        default: return "دخل إضافي"
        }
    }
}
