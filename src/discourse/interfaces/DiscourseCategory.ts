export interface DiscourseCategory {
  category_list: {
    can_create_category: boolean;
    can_create_topic: boolean;
    categories: {
      id: number;
      name: string;
      color: string;
      text_color: string;
      slug: string;
      topic_count: number;
      post_count: number;
      position: number;
      description: string;
      description_text: string;
      description_excerpt: string;
      topic_url?: string;
      read_restricted: boolean;
      permission: number;
      notification_level: number;
      can_edit: boolean;
      topic_template?: string;
      has_children: boolean;
      sort_order?: string;
      sort_ascending: unknown;
      show_subcategory_list: boolean;
      num_featured_topics: number;
      default_view?: string;
      subcategory_list_style: string;
      default_top_period: string;
      default_list_filter: string;
      minimum_required_tags: number;
      navigate_to_first_post_after_read: boolean;
      custom_fields: {
        has_chat_enabled?: boolean;
        enable_unassigned_filter: unknown;
        sort_topics_by_event_start_date: unknown;
        disable_topic_resorting: unknown;
        create_as_post_voting_default: unknown;
        only_post_voting_in_this_category: unknown;
        enable_accepted_answers?: string;
      };
      topics_day: number;
      topics_week: number;
      topics_month: number;
      topics_year: number;
      topics_all_time: number;
      subcategory_ids: number[];
      uploaded_logo: unknown;
      uploaded_logo_dark: unknown;
      uploaded_background: unknown;
      uploaded_background_dark: unknown;
      is_uncategorized?: boolean;
    }[];
  };
}
