export interface DiscourseTopics {
  users: {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
    admin?: boolean;
    moderator?: boolean;
    trust_level: number;
    primary_group_name?: string;
    flair_name?: string;
    flair_url?: string;
    flair_bg_color?: string;
    flair_color?: string;
    flair_group_id?: number;
  }[];
  primary_groups: {
    id: number;
    name: string;
  }[];
  flair_groups: {
    id: number;
    name: string;
    flair_url: string;
    flair_bg_color: string;
    flair_color: string;
  }[];
  topic_list: {
    can_create_topic: boolean;
    more_topics_url: string;
    for_period: string;
    per_page: number;
    topics: {
      id: number;
      title: string;
      fancy_title: string;
      slug: string;
      posts_count: number;
      reply_count: number;
      highest_post_number: number;
      image_url: string;
      created_at: string;
      last_posted_at: string;
      bumped: boolean;
      bumped_at: string;
      archetype: string;
      unseen: boolean;
      last_read_post_number?: number;
      unread?: number;
      new_posts?: number;
      unread_posts?: number;
      pinned: boolean;
      unpinned: unknown;
      visible: boolean;
      closed: boolean;
      archived: boolean;
      notification_level?: number;
      bookmarked?: boolean;
      liked?: boolean;
      tags_descriptions: unknown;
      views: number;
      like_count: number;
      has_summary: boolean;
      last_poster_username: string;
      category_id: number;
      pinned_globally: boolean;
      featured_link: unknown;
      has_accepted_answer: boolean;
      can_vote: boolean;
      posters: {
        extras?: string;
        description: string;
        user_id: number;
        primary_group_id?: number;
        flair_group_id?: number;
      }[];
    }[];
  };
}
