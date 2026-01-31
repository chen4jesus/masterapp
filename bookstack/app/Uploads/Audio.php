<?php

namespace BookStack\Uploads;

use BookStack\App\Model;
use BookStack\Entities\Models\Entity;
use BookStack\Entities\Models\Page;
use BookStack\Permissions\Models\JointPermission;
use BookStack\Permissions\PermissionApplicator;
use BookStack\Users\Models\HasCreatorAndUpdater;
use BookStack\Users\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int    $id
 * @property string $name
 * @property string $path
 * @property string $extension
 * @property ?Page  $page
 * @property bool   $external
 * @property int    $uploaded_to
 * @property User   $updatedBy
 * @property User   $createdBy
 *
 * @method static Entity|Builder visible()
 */
class Audio extends Model
{
    protected $table = 'audios';
    use HasCreatorAndUpdater;
    use HasFactory;

    protected $fillable = ['name', 'order'];
    protected $hidden = ['page'];
    protected $casts = [
        'external' => 'bool',
    ];

    /**
     * Get the downloadable file name for this upload.
     */
    public function getFileName(): string
    {
        if (str_contains($this->name, '.')) {
            return $this->name;
        }

        return $this->name . '.' . $this->extension;
    }

    /**
     * Get the page this file was uploaded to.
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'uploaded_to');
    }

    public function jointPermissions(): HasMany
    {
        return $this->hasMany(JointPermission::class, 'entity_id', 'uploaded_to')
            ->where('joint_permissions.entity_type', '=', 'page');
    }

    /**
     * Get the url of this file.
     */
    public function getUrl($openInline = false): string
    {
        if ($this->external && !str_starts_with($this->path, 'http')) {
            return $this->path;
        }

        return url('/audios/' . $this->id . ($openInline ? '?open=true' : ''));
    }

    /**
     * Get the representation of this attachment in a format suitable for the page editors.
     * Detects and adapts video content to use an inline video embed.
     */
    public function editorContent(): array
    {
        $audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'alac', 'aiff', 'opus', 'mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', '3gp', 'mpg', 'mpeg', 'ogv', 'ts', 'rm'];
        if (in_array(strtolower($this->extension), $audioExtensions)) {
            $html = '<a class ="audiotime" data-url="' . e($this->getUrl()) . '">00:00:00</a> ';
            return ['text/html' => $html, 'text/plain' => $html];
        }

        return ['text/html' => $this->htmlLink(), 'text/plain' => $this->markdownLink()];
    }

    /**
     * Generate the HTML link to this attachment.
     */
    public function htmlLink(): string
    {
        return '<a class = "audiotime" data-url="' . e($this->getUrl()) . '">00:00:00</a> ';
    }

    /**
     * Generate a MarkDown link to this attachment.
     */
    public function markdownLink(): string
    {
        return '[' . $this->name . '](' . $this->getUrl() . ')';
    }

    /**
     * Scope the query to those attachments that are visible based upon related page permissions.
     */
    public function scopeVisible(): Builder
    {
        $permissions = app()->make(PermissionApplicator::class);

        return $permissions->restrictPageRelationQuery(
            self::query(),
            'audios',
            'uploaded_to'
        );
    }
}
