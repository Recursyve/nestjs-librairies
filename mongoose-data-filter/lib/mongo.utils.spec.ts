import { MongoUtils } from "./mongo.utils";

describe("MongoUtils", () => {
    it("reduceLookups should reduce and remove duplicates lookups", async () => {
        const lookups = MongoUtils.reduceLookups([
            [
                {
                    $lookup: {
                        from: "places",
                        let: { placesId: "$places" },
                        as: "places",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$placesId"]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "coords",
                                    let: { geoCoordId: "$geoCoord" },
                                    as: "geoCoord",
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$_id", "$$geoCoordId"]
                                                }
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: {
                                    path: `$geoCoord`,
                                    preserveNullAndEmptyArrays: true
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "places",
                        let: { placesId: "$places" },
                        as: "places",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$placesId"]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "coords",
                                    let: { geoCoordId: "$geoCoord" },
                                    as: "geoCoord",
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$_id", "$$geoCoordId"]
                                                }
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: "locations",
                                                let: { locationId: "$location" },
                                                as: "location",
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ["$_id", "$$locationId"]
                                                            }
                                                        }
                                                    }
                                                ]
                                            },
                                        },
                                        {
                                            $unwind: {
                                                path: `$location`,
                                                preserveNullAndEmptyArrays: true
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: {
                                    path: `$geoCoord`,
                                    preserveNullAndEmptyArrays: true
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "places",
                        let: { placesId: "$places" },
                        as: "places",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$placesId"]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "coords",
                                    let: { billingCoordId: "$billingCoord" },
                                    as: "billingCoord",
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$_id", "$$billingCoordId"]
                                                }
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: {
                                    path: `$billingCoord`,
                                    preserveNullAndEmptyArrays: true
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: "places",
                        let: { placesId: "$places" },
                        as: "places",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$placesId"]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "coords",
                                    let: { billingCoordId: "$billingCoord" },
                                    as: "billingCoord",
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$_id", "$$billingCoord"]
                                                }
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: "locations",
                                                let: { locationId: "$location" },
                                                as: "location",
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ["$_id", "$$locationId"]
                                                            }
                                                        }
                                                    }
                                                ]
                                            },
                                        },
                                        {
                                            $unwind: {
                                                path: `$location`,
                                                preserveNullAndEmptyArrays: true
                                            }
                                        }
                                    ]
                                },
                            },
                            {
                                $unwind: {
                                    path: `$billingCoord`,
                                    preserveNullAndEmptyArrays: true
                                }
                            }
                        ]
                    }
                }
            ]
        ]);
        expect(lookups).toBeDefined();
        expect(lookups).toStrictEqual([
            {
                $lookup: {
                    from: "places",
                    let: { placesId: "$places" },
                    as: "places",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$placesId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "coords",
                                let: { geoCoordId: "$geoCoord" },
                                as: "geoCoord",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$geoCoordId"]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "locations",
                                            let: { locationId: "$location" },
                                            as: "location",
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$_id", "$$locationId"]
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: `$location`,
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: {
                                path: `$geoCoord`,
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: "coords",
                                let: { billingCoordId: "$billingCoord" },
                                as: "billingCoord",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$billingCoordId"]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "locations",
                                            let: { locationId: "$location" },
                                            as: "location",
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$_id", "$$locationId"]
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: `$location`,
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: {
                                path: `$billingCoord`,
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ]
                }
            }
        ]);
    });
});
