<script lang="ts">
    import { onMount } from 'svelte';

    export let slug: string;
    export let increment: boolean = false;
    
    let views = 0;
    let loading = true;

    onMount(async () => {
        try {
            let url = `/api/stats?slug=${slug}`;
            let method = 'GET';

            if (increment) {
                const viewedSession = sessionStorage.getItem(`viewed_${slug}`);
                if (!viewedSession) {
                    url += '&action=view';
                    method = 'POST';
                    sessionStorage.setItem(`viewed_${slug}`, 'true');
                }
            }

            const res = await fetch(url, { method });
            if (res.ok) {
                const data = await res.json();
                views = data.views;
            }
        } catch (e) {
            console.error('Failed to fetch views', e);
        } finally {
            loading = false;
        }
    });
</script>

<span class="flex items-center gap-1">
    {#if loading}
        <span class="animate-pulse">...</span>
    {:else}
        {views}
    {/if}
</span>
