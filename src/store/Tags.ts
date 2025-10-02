import { Minimatch } from "minimatch";

export type SimpleTag = string;
export type ScopedTag = [string, string];
export type Tag = SimpleTag | ScopedTag;
export type TagsInput = Tag[];

export class Tags {
  public readonly tags: readonly Tag[];
  private readonly scopedTags = new Map<string, string>();

  public constructor(tags: TagsInput = []) {
    this.tags = Object.freeze([...tags]);
    tags.filter(isScopedTag).forEach(([scope, value]) => {
      this.scopedTags.set(scope, value);
    });
  }

  public matching(tag: Tag) {
    const firstIsSimple = isSimpleTag(tag);
    const firstMiniMatch = new Minimatch(firstIsSimple ? tag : tag[1]);

    const matcher = (second: Tag) => {
      const secondIsSimple = isSimpleTag(second);
      if (firstIsSimple && secondIsSimple) {
        return firstMiniMatch.match(second);
      }

      if (!firstIsSimple && !secondIsSimple) {
        const firstScope = tag[0];
        const secondScope = second[0];
        return firstScope === secondScope && firstMiniMatch.match(second[1]);
      }

      return false;
    };

    return this.tags.some(matcher);
  }

  public getByScope(scope: string) {
    return this.scopedTags.get(scope);
  }
}

function isSimpleTag(tag: Tag): tag is SimpleTag {
  return typeof tag === "string";
}

function isScopedTag(tag: Tag): tag is ScopedTag {
  return Array.isArray(tag);
}
