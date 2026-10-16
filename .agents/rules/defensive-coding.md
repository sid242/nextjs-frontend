# Defensive Coding & Null-Safety Rule

Whenever accessing properties from any object or performing operations on arrays or collections, always use optional chaining (`?.`) and nullish coalescing (`??`).

## Rules

1. **Object Property Access**:
   - Always use `obj?.property` instead of `obj.property` when accessing nested fields, props, or API response objects unless the object is guaranteed to be non-null by a preceding guard.
   - Example:
     ```typescript
     // Bad:
     const name = user.profile.name;
     // Good:
     const name = user?.profile?.name;
     ```

2. **Array and Collection Operations**:
   - Always use `arr?.map(...)`, `arr?.filter(...)`, `arr?.length`, `arr?.find(...)`, `arr?.slice(...)`, etc.
   - Example:
     ```typescript
     // Bad:
     options.filter((opt) => opt.label.includes(query));
     // Good:
     options?.filter((opt) => opt?.label?.toLowerCase()?.includes(query)) ?? [];
     ```

3. **Event & Callback Handling**:
   - Always use optional chaining on event properties that may vary by browser or synthetic event type:
     ```typescript
     const value = e?.target?.value;
     onChange?.(value);
     ```

4. **Form & State Operations**:
   - When extracting errors or field state from forms or TanStack Query responses:
     ```typescript
     const errorMsg = fieldState?.error?.message;
     const dataList = query?.data?.items ?? [];
     ```

5. **String & Number Formatting**:
   - Chain methods defensively on values:
     ```typescript
     const text = val?.toString()?.trim() ?? "";
     ```
