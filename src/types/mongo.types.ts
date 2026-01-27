export interface DateRangeQuery {
  $gte?: Date;
  $lte?: Date;
}

export interface RegexQuery {
  $regex: string;
  $options: string;
}

export interface OrQuery {
  $or: Record<string, RegexQuery>[];
}

export interface ApprehensionFilterQuery {
  dateOfApprehension?: DateRangeQuery;
  agency?: RegexQuery;
  violation?: RegexQuery;
  mvType?: RegexQuery;
  plateNumber?: RegexQuery;
  $or?: Record<string, RegexQuery>[];
}
